// Core node modules
import fs from 'node:fs';
import path from 'node:path';

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

  const webDir = framework.cache.get ('webDir');
  const publicFilesDir = path.join(webDir, 'public');

  const css = fs.readFileSync(path.join(publicFilesDir, 'css', 'root.css')).toString();

  const httpResponseBase = {
    http_code: 200,
    response_data: css,
    response_type: framework.enums.HTTP_RESPONSE_TYPE.CSS
  };

  return framework.model.generateModel(httpResponseBase, framework.models.httpResponse);
}