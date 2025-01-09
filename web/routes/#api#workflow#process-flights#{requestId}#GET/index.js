// Voyzu framework
import framework from 'voyzu-framework-01';

// Modules from this comonent
import * as progress from '../../../workflow/workflows/process-flights/progress.js';

/**
 * Route entry point.
 * @param {object} httpRequest An object conforming to the http-request model.
 * @param {object} context The context passed by vserver or vmock.
 * @param {object} pathParams An object with all path parameters passed to this route.
 * @returns {object} An object conforming to the http-response model.
 */
export async function fulfill(httpRequest, context, pathParams) {

    const status = await progress.getProgress (pathParams.requestId);

    // And return a response
    const httpResponseBase = {
        http_code: framework.enums.HTTP_CODE.SUCCESS,
        response_data: {
            status
        },
        response_type: framework.enums.HTTP_RESPONSE_TYPE.JSON
    };

    return framework.model.generateModel(httpResponseBase, framework.models.httpResponse);
}