// Voyzu framework
import framework from 'voyzu-framework-01';

// Modules from this component
import * as crud from '../../../logic/crud/crud.js';
import * as flightSchema from '../../../logic/models/flight.js';

/**
 * Route entry point.
 * @param {object} httpRequest An object conforming to the http-request model.
 * @param {object} context The context passed by vserver or vmock.
 * @param {object} pathParams An object with all path parameters passed to this route.
 * @returns {object} An object conforming to the http-response model.
 */
export async function fulfill(httpRequest, context, pathParams) {

    // Ensure body is in JSON format
    const body = framework.helpers.jsonHelper.parse(httpRequest.request_values.body);
    body.flightLength = Number.parseFloat (body.flightLength);

    // Ensure flight matches the expected schema
    const flightToSave = framework.model.generateModel(body, flightSchema.schema);

    // Update the flight using our crud logic library
    const flight = await crud.updateFlight (flightToSave);

    // And return a response
    const httpResponseBase = {
        http_code: framework.enums.HTTP_CODE.SUCCESS,
        response_data: flight,
        response_type: framework.enums.HTTP_RESPONSE_TYPE.JSON
    };

    return framework.model.generateModel(httpResponseBase, framework.models.httpResponse);
}