/*eslint complexity: "off"*/
/*eslint prefer-destructuring: "off"*/

// Import core node modules
import fs from 'node:fs';
import path from 'node:path';

// Import third party libraries
import nunjucks from 'nunjucks';

// Import the Voyzu Framework
import framework from 'voyzu-framework-01';

// Modules from this component
import * as crud from '../logic/crud/crud.js';

// Module constants
const HTTP_CODE = framework.enums.HTTP_CODE;
const HTTP_RESPONSE_TYPE = framework.enums.HTTP_RESPONSE_TYPE;
const log = framework.devops.log;

/**
 * Component entry point.
 * Receives a web request, authorizes it, passes the request to the matching route
 * and returns the response.
 * @param {object} event A web request, conforms to the HttpRequest model.
 * @param {object} context The web request context.
 * @returns {object} A web response, conforms to the HttpResponse model.
 */
export async function fulfillRequest(event, context) {

  // If the event is not an httpRequest model its not gunna work
  const httpRequest = framework.model.generateModel(event, framework.models.httpRequest);

  // Retrieve some handy values from the cache. These values are set when the framework first initializes.
  const webDir = framework.cache.get('webDir');
  const config = framework.cache.get('config');
  const pkg = framework.cache.get('pkg');
  const redisClient = framework.cache.get('redisClient');

  // Log http request received, depending on config settings
  if (config.logEvent && (config.logPublicRoutes === true || (config.logPublicRoutes !== true && httpRequest.route.file_friendly_route.split('#').find(Boolean) !== 'public'))) {
    log.debug(`received request`, httpRequest.request_id, event);
  }

  // Retrieve flights database from in-memory cache
  if (!framework.cache.get('flights')) {
    framework.cache.set('flights', crud.createTestData());
  }

  // Return a response to a CORS (OPTIONS) request before attempting to authorize
  if (httpRequest.request_context?.http.method === 'OPTIONS') {
    if (framework.helpers.booleanHelper.isTrue(config.allowCrossOrigin)) {
      const httpResponse = framework.web.response.getOptionsResponse();
      log.debug(` ${httpRequest.route?.url}: returning ${httpResponse.response_type} ${httpResponse.http_code}`, httpRequest.request_id);
      return httpResponse;
    }
    log.debug(`request for OPTIONS but we aren't supporting cross origin requests`, httpRequest.request_id);
    return;    // Don't return anything

  } // End http method is OPTIONS

  // Set things up

  nunjucks.configure({
    autoescape: false,
    // ThrowOnUndefined: true
  });

  // Authorize this call
  const auth = await framework.web.auth.getSessionAuthorization(httpRequest, config, pkg.name, redisClient);

  // Log authorization object returned, depending on config settings
  if (config.logAuth && (config.logPublicRoutes === true || (config.logPublicRoutes !== true && httpRequest.route.file_friendly_route.split('#').find(Boolean) !== 'public'))) {
    log.debug(`Authorization:`, httpRequest.request_id, auth);
  }

  // Deal with authorization failure
  // Here we simply return a basic 404 page
  if (!auth.authorized) {

    log.error('Authorization fails', httpRequest.request_id, new Error(`Auth fail`), auth);

    let httpResponse = {
      http_code: HTTP_CODE.UNAUTHORIZED,
      response_data: '<html><body><h1>401. Unauthorized</h1></body></html>',
      response_type: HTTP_RESPONSE_TYPE.HTML
    };

    httpResponse = framework.model.generateModel(httpResponse, framework.models.httpResponse);

    log.debug(`${httpRequest.route.url}: returning ${httpResponse.response_type} ${httpResponse.http_code}`, httpRequest.request_id);

    return httpResponse;
  }

  // Request is authorized, attept to serve route called

  const routes = fs.readdirSync(path.join(webDir, 'routes'));

  // Find the route that matches the file friendly route supplied
  const matchingRoute = framework.web.routing.matchRoute(httpRequest.route.file_friendly_route, routes, path.join(webDir, 'routes'));

  // If no routes match, return 404
  if (!matchingRoute) {
    log.debug(`no route matching ${httpRequest.route.file_friendly_route} found, returning 404`, httpRequest.request_id);

    let httpResponse = {
      http_code: HTTP_CODE.NOT_FOUND,
      response_data: '<html><body><h1>404. Not found</h1></body></html>',
      response_type: HTTP_RESPONSE_TYPE.HTML
    };

    httpResponse = framework.model.generateModel(httpResponse, framework.models.httpResponse);

    log.debug(`${httpRequest.route.url}: returning ${httpResponse.response_type} ${httpResponse.http_code}`, httpRequest.request_id);

    return httpResponse;
  }

  log.debug(`fulfilling ${httpRequest.route.url} with /routes/${matchingRoute.matchingRoute}`, httpRequest.request_id);

  // Attempt to fulfill the http request by importing the route and calling its fulfill method
  let fulfillRoutePath = matchingRoute.matchingRouteFilePath;

  if (config.hotReload) {
    fulfillRoutePath += `?cachebust=${Date.now()}`;
  }

  let httpResponse;
  try {
    const fulfillRoute = await import(fulfillRoutePath);
    httpResponse = await fulfillRoute.fulfill(httpRequest, context, matchingRoute.pathParams);

    if (!httpResponse) {
      // Will be immedately caught by the catch below. This gives a more meaningfull error
      throw new Error(`[${pkg.name}] ${fulfillRoutePath} did not return a response`);
    }
  } catch (error) {
    if (config.throwErrors) {
      throw error;
    } else {

      log.error('Error fulfilling request', httpRequest.request_id, error, httpRequest);

      return framework.web.response.getErrorResponse(httpRequest);
    }
  }

  // Final validaiton before we return our http response
  httpResponse = framework.model.generateModel(httpResponse, framework.models.httpResponse);

  log.debug(`${httpRequest.route.url}: returning ${httpResponse.response_type} ${httpResponse.http_code}`, httpRequest.request_id);

  if (config.logResponse && (config.logPublicRoutes === true || (config.logPublicRoutes !== true && httpRequest.route.file_friendly_route.split('#').find(Boolean) !== 'public'))) {
    log.debug('http response returned', httpRequest.request_id, httpResponse);
  }

  return httpResponse;

}
