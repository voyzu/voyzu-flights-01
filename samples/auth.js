// Import core node modules
import * as url from 'node:url';
import path from 'node:path';

// Import voyzu framework
import framework from "voyzu-framework-01";

// Get some initial values that the authorization function needs
// We need to pass a component directory to initialization as process.cwd() doesn't work for adhoc execution
const thisDir = url.fileURLToPath(new URL('.', import.meta.url));
const componentDir = path.join(thisDir, '..');
const { config, redisClient, pkg } = await framework.devops.init.initializeComponent(false, true, componentDir);

// Generate a dummy http request
const httpRequest = {
    "request_id": "mock-index",
    "route": {
        "component_root_url": "http://localhost:2500",
        "file_friendly_route": "#GET",
        "url": "http://localhost:2500"
    }
};

// Authorize the request using the custom function below
const auth = await framework.web.auth.authorizeAndCreateSession(customAuthFunction, httpRequest, config, pkg.name, redisClient);

let httpResponse;
if (auth.authorized) {
    // Custom function returns authorization object that is authorized
    console.log('Authorization successful!');

    httpResponse = framework.web.auth.generateJsonSuccessResponse(auth.cookie, '/app-start-page');

} else {
    console.log('Authorization not successful!');
    httpResponse = framework.web.auth.generateJsonFailResponse(auth.authorization_fail_reason ?? 'Unknown authorization error');
}

console.log(httpResponse);

function customAuthFunction(httpRequest, config) {

    // Do something with the request e.g. validate username and password against a database etc

    // Create an authorization object, this one is not very exciting
    // There is no session object here so a default empty session will be created, in the real world you would probably create a session object
    // With user details
    const auth = {
        authorized: true,
    };

    // The authorization object must conform to the framework authorization model schema
    return framework.model.generateModel(auth, framework.models.authorization);
}