// Voyzu framework
import framework from 'voyzu-framework-01';

/**
 * Route entry point.
 * @param {object} httpRequest An object conforming to the http-request model.
 * @param {object} context The context passed by vserver or vmock.
 * @param {object} pathParams An object with all path parameters passed to this route.
 * @returns {object} An object conforming to the http-response model.
 */
export async function fulfill(httpRequest, context, pathParams) {

    // Retrieve values from applicaiton cache
    const pkg = framework.cache.get('pkg');
    const redisClient = framework.cache.get('redisClient');

    // Create a workflow job
    const workflowJob = {
        origin: framework.enums.WORKFLOW_REQUEST_ORIGIN.BROWSER,
        request_id: httpRequest.request_id
    };

    // publish this workflow job to our application subscriber.
    await framework.workflow.pubsub.publishWorkflowJob('process-flights', '01-first-two', workflowJob, pkg.name, redisClient);
   
    // And return a response
    const httpResponseBase = {
        http_code: framework.enums.HTTP_CODE.ACCEPTED,
        response_data: {
            requestId: httpRequest.request_id
        },
        response_type: framework.enums.HTTP_RESPONSE_TYPE.JSON
    };

    return framework.model.generateModel(httpResponseBase, framework.models.httpResponse);
}