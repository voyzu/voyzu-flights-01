// Voyzu framework
import framework from 'voyzu-framework-01';

// Modules from this component
import * as crud from '../../../logic/crud/crud.js';

/**
 * Route entry point.
 * @param {object} httpRequest An object conforming to the http-request model.
 * @param {object} context The context passed by vserver or vmock.
 * @param {object} pathParams An object with all path parameters passed to this route.
 * @returns {object} An object conforming to the http-response model.
 */
export async function fulfill(httpRequest, context, pathParams) {

    crud.deleteFlight(pathParams.id);

    // Compose a message to cache, this message can then be retrieved
    // By the UI
    const message = {
        id: framework.helpers.cryptoHelper.generateUuid(),
        message: `Flight id ${pathParams.id} deleted`,
        message_heading:'Flight deleted',
        message_level: framework.enums.MESSAGE_LEVEL.SUCCESS
    };

    framework.cache.set(`message:${message.id}`, message);

    // And return a response
    const httpResponseBase = {
        http_code: framework.enums.HTTP_CODE.SUCCESS,
        response_data: {
            messageId: message.id
        },
        response_type: framework.enums.HTTP_RESPONSE_TYPE.JSON
    };

    return framework.model.generateModel(httpResponseBase, framework.models.httpResponse);
}