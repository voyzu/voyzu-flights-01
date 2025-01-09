// Voyzu framework
import framework from "voyzu-framework-01";

// Modules from this component
import * as crud from '../../../../logic/crud/crud.js';

// Module constants
const { log } = framework.devops;

// Module primitive constants (settings)
const NEXT_STEP_NAME = '02-even-numbers';
const WAIT_MS = 1000;

/**
 * Process this step of the workflow.
 * @param {string} channelName Name of the channel this workflow belongs to.
 * @param {string} keyName Name of the redis key that holds the workflow job.
 */
export async function fulfill(channelName, keyName) {

    // Get some handy values from the cache
    const config = framework.cache.get('config');
    const pkg = framework.cache.get('pkg');
    const redisClientBase = framework.cache.get('redisClient');

    // Connect up to redis
    const redisClient = await redisClientBase.duplicate();
    redisClient.connect();

    redisClient.on('error', async (error) => {
        log.error(`On error in redisClient key ${keyName}`);
        log.error(error);
    });

    // First step is to grab the key with the parameter name passed to this function
    let keyValue = await redisClient.GET(keyName);

    // If the key doesn't exist we can't do anything
    if (!keyValue) {
        log.error(`Redis key ${keyName} does not exist.  Cannot continue`);
        await redisClient.quit();
        return;
    }

    keyValue = framework.helpers.jsonHelper.parse(keyValue);

    // The key value should always be a valid workflow job
    const workflowJob = framework.model.generateModel(keyValue, framework.models.workflowJob);

    if (config.logEvent) {
        log.debug(`[${pkg.name}] processing key ${keyName}`, workflowJob.requestId, workflowJob);
    }

    /************************************
     * Workflow step work
     ***********************************/

    const flights = framework.cache.get('flights');
    if (!flights){
        log.error(`There are no flights in memory. Flights are created when you first view the web application. Perhaps you have not viewed the application in your browser. Cannot continue`);
        await redisClient.quit();
        return;
    }

    try {
        for (let i = 0; i < 2; i++) {
            const flight = flights[i];
            flight.processed = true;
            await crud.updateFlight(flight);
            await framework.helpers.waitHelper.wait(WAIT_MS);
        }
    } catch (error){
        log.error (`error processing key ${keyName}`,workflowJob.request_id,error,workflowJob);
    }

    /************************************
     * End workflow step work
     ***********************************/

    /************************************
     * Create next step
     ***********************************/
    // Having done our work we pass the baton to the next step by creating a new workflow job and storing in a key
    // That ends with the next step name
    const nextStepJob = structuredClone(workflowJob);

    const segments = keyName.split(':');
    segments.pop();
    segments.push(NEXT_STEP_NAME);
    const nextStepKeyName = segments.join(':');

    await redisClient.SET(nextStepKeyName, JSON.stringify(nextStepJob));

    // We let our workflow subscriber know the key is available to process
    await redisClient.PUBLISH(channelName, nextStepKeyName);

    /************************************
     * End create next step
     ***********************************/

    // We now delete the key
    await redisClient.DEL(keyName);

    // Close the redis client and we are done
    await redisClient.quit();
}