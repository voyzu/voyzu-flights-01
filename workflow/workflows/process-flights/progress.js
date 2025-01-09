/* eslint "require-atomic-updates":"off" */
/* eslint "id-length":"off" */

// Import nodejs core modules
import path from 'node:path';
import * as url from "node:url";

// Import voyzu framework
import framework from "voyzu-framework-01";

// Module constants
let redisClient;

/**
 * Get progress of the workflow request.
 * @param {string} requestId The workflow request id.
 * @returns {object} The status of the workflow.
 */
export async function getProgress(requestId) {

    // Retrieve some handy values from the cache
    const pkg = framework.cache.get('pkg');
    const workflowDir = framework.cache.get('workflowDir');
    const redisClientBase = framework.cache.get('redisClient');

    // Parse out the redis channel name from the component name and this path
    const thisDirname = url.fileURLToPath(new URL('.', import.meta.url));
    const thisPath = path.relative(workflowDir, thisDirname);
    const channelName = `${pkg.name}:${thisPath.replaceAll(path.sep, ':')}`;

    // The root key name is the channel name with the request Id appended to it
    const rootKeyName = `${channelName}:${requestId}`;

    // Connect up to redis
    if (!redisClient) {
        redisClient = await redisClientBase.duplicate();
        redisClient.connect();
    }

    // Find all matching keys in flight (if any)
    let keysInFlight = [];
    for await (const key of redisClient.scanIterator({ MATCH: `${rootKeyName}*` })) {
        keysInFlight.push(key);
    }

    // In theory there should only be one key in flight
    // But in case there are more, sort them Z to A
    keysInFlight = keysInFlight.sort((a, b) => b.localeCompare(a));

    let status;
    if (keysInFlight.length === 0) {
        status = {
            commentary: 'Processing complete',
            percentComplete: 100,
            status: framework.enums.PROCESS_STATUS.PROCESSED,
        };
    } else {
        const keyInFlight = keysInFlight[0];

        // Parse the step number from the key name
        const segments = keyInFlight.split(':');
        const step = segments.pop();
        const stepNumber = step.slice(0, 2);

        // Set the status based on the currently executing workflow step
        switch (stepNumber) {
            case '01': {
                status = {
                    commentary: 'Processing first two flights',
                    percentComplete: 20,
                    status: framework.enums.PROCESS_STATUS.PROCESSING
                };
                break;
            }

            case '02': {
                status = {
                    commentary: 'Processing even numbered flights',
                    percentComplete: 50,
                    status: framework.enums.PROCESS_STATUS.PROCESSING
                };
                break;
            }

            case '03': {
                status = {
                    commentary: 'Processing remaining flights',
                    percentComplete: 70,
                    status: framework.enums.PROCESS_STATUS.PROCESSING
                };
                break;
            }

            default: {
                status = {
                    commentary: 'Unknown Step',
                    percentComplete: 100,
                    status: framework.enums.PROCESS_STATUS.FAIL,
                };
                break;
            }
        }
    }

    return status;
}