/* eslint no-magic-numbers:"off" */

// Import nodejs core modules
import path from 'node:path';
import * as url from "node:url";

// Import voyzu framework
import framework from "voyzu-framework-01";

// Module constants
const { log } = framework.devops;

// Module variables
let thisDirName;
let config;
let pkg;

/**
 * Route events sent by the application subscriber to the matching workflow / step for fulfillment.
 * @param {string} keyName The name of the Redis key to process.
 */
export async function fulfillRequest(keyName) {

    if (!thisDirName) {
        config = framework.cache.get('config');
        pkg = framework.cache.get('pkg');
        thisDirName = url.fileURLToPath(new URL('.', import.meta.url));
    }

    const keyNameSegments = keyName.split(':');
    const workflowName = keyNameSegments[2];
    const requestId = keyNameSegments[3];
    const stepName = keyNameSegments[4];

    const fulfillRoutePath = path.join(thisDirName, 'workflows', workflowName, stepName, 'index.js');

    let filePath = url.pathToFileURL(fulfillRoutePath);
    filePath = filePath.href;

    if (config.hotReload) {
        filePath += `?cachebust=${Date.now()}`;
    }

    try {
        const fulfillRoute = await import(filePath);
        fulfillRoute.fulfill(pkg.name, keyName);
    } catch (error) {
        log.error(`there was an error fulfilling ${fulfillRoutePath} with keyName ${keyName}`, requestId, error);
    }
}