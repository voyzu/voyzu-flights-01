# Voyzu Flights

Voyzu Flights is a [Voyzu Framework](https://github.com/voyzu/voyzu-framework-01) compatible NodeJS web application that serves two purposes:

1. It demonstrates much of the Voyzu Framework capability
2. It can be used as a template when creating a new Voyzu Framework compatible web application

The app features a very basic flight arrivals board and includes the ability to "process" flights, demonstrating the framework's async processing capability.

The application is a web application, meaning you access it using a browser. It can be run on Windows or Linux. Test data is generated on application start up, and data is stored in memory (meaning that data will change every time you stop and then start the application)

# Links

[Voyzu Framework](https://github.com/voyzu/voyzu-framework-01)

[Voyzu Flights online](https://voyzu-flights.voyzu.net)

## Prerequisites

Voyzu Flights requires that the [Voyzu Framework](https://github.com/voyzu/voyzu-framework-01), and its pre-requisites (NodeJS, npm and Redis) be installed

## Install

- make sure you have the pre-requisites above installed.
- clone this repo as a peer repository to voyzu-framework-01
- `cd voyzu-flights-01`
- `npm install`

## Getting started

Voyzu Flights is now installed however a little configuration is required to get it up and running. From the voyzu-flights-01 command line run `npm run mock-web`. This will pass a mock event (`mock/events/default.json`) to the built in web router and return an http response to the console. You will see an error response saying the call is not authorized, don't panic, this is expected. Because this is the first time you will have run Voyzu Flights a `config.js` file will be created in the root of your voyzu-flights-01 directory. For security reasons this default config is created with production values. Edit the new config.js file and uncomment out the line `bypassAuth: true`. Doing this opens application access up to the world (so you wouldn't necessarliy want to have this setting turned on in production!).

With authorization bypassed run `npm run mock-web` again, you should see a 200 success response printed to the console.

If the mock command succeeds you can proceed to run `npm start` from within the `voyzu-flights-01` directory. This command will start the built-in web server and the built-in workflow engine. You should see various messages including a message saying that the web server is running on localhost:2500.  Open a browser and navigate to this address - you should see the Voyzu Flights index page. When you are ready, stop the web server as you would any NodeJS process (e.g. ctrl C)

## Voyzu Flights built-in functionality

 Voyzu Flights contains a number of package.json script entries that can be called, as per standard npm functionality, using `npm run`

 **Code snippet from [package.json](https://github.com/voyzu/voyzu-flights-01/tree/main/package.json):**

```json
"scripts": {
        "deploy": "node deploy/deploy.js",
        "lint": "npx eslint . --fix",
        "mock-web": "node mock/mock-web.js",
        "mock-workflow": "node mock/mock-workflow.js",
        "start": "node start.js",
        "update-deps": "npx updates -u -m && npm install"
    }
```

These scripts are all explained in the various sections in this document below. Let's examine here just one of these entries, `start`. This command can be run from the command line as `npm run start`. Again, this is standard npm functionality. As can be seen above, the start command will run `node start.js`.  As no path is specified, we know that `start.js` lives in the root of our application directory. Let's take a look at this file

**Code snippet from [start.js](https://github.com/voyzu/voyzu-flights-01/blob/main/start.js):**

```javascript
// Core node modules
import fs from 'node:fs';

// Voyzu framework
import framework from 'voyzu-framework-01';

// Start 'er up!
start();

async function start() {
    // Initialize our component.  This also makes sure that the voyzu conforms
    // To at least the high level structure of a Voyzu Component
    const appValues = await framework.devops.init.initializeComponent(true, true);

    if (!appValues) {
        // Initialization hasn't worked
        // Initialization will take care of its own errors, just exit
        return;
    }

    const { webDir, workflowDir } = appValues;

    if (fs.existsSync (workflowDir)) {
        framework.workflow.pubsub.subscribe();
    } else {
        console.log('No workflow directory found, workflow service not started');
    }

    if (fs.existsSync(webDir)) {
        framework.web.server.listen();
    } else {
        console.log('No website directory found, website service not started');
    }
}
```

Here we can see that two significant areas of Framework functionality are being invoked: `framework.workflow.pubsub.subscribe()` which attaches a listener to the applicaton's Redis channel (voyzu-flights-01), and `framework.web.server.listen()` which starts the framework NodeJS http server. This is a common pattern used in Voyzu Flights; key functionality is present in the application itself, and this functionality calls the framework. Conceptually you can think of the Voyzu Framework as sitting "behind" your application. Your application is the star, the framework works behind the scenes.

Tip: `start` is actually a special command and can be run simply with `npm start` (i.e. the "run" can be ommitted for this command)

## Voyzu Framework functionality used

 The below sections outline how this sample web application uses Voyzu Framework functionality to serve and route web requests, perform async processing and more. If you simply want to get started creating your own Voyzu Framework compatible app then you can skip to the "Creating your own Voyzu Framework compatible web application" section below.

### Calling Voyzu Framework functions

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01?tab=readme-ov-file#using-the-framework-in-your-code)

The Voyzu Framework library is used throughout Voyzu Flights. You will see towards the top of most code files:

```javascript
import framework from 'voyzu-framework-01';
```

The framework groups functionality into a logical structure. For example the code in [web/routes/#flight#{id}#GET/index.js](https://github.com/voyzu/voyzu-flights-01/blob/main/web/routes/%23flight%23%7Bid%7D%23GET/index.js) utilizes the `framework.web.ui` library and calls the `getCode()` method of the `alert` module:

**Code snippet from [web/routes/#flight#{id}#GET/index.js](https://github.com/voyzu/voyzu-flights-01/blob/main/web/routes/%23flight%23%7Bid%7D%23GET/index.js):**

```javascript
  // get javascript code from the framwwork to inject into the page
  let jsCode = '\n\n<script>';
  jsCode += framework.web.ui.alert.getCode();
```

### The in-memory cache

The framework in-memory cache is a simple key / value cache. Values are set to the cache by calling `framework.cache.get (<key (string)>, <value (any)>)` and retreived from the cache by calling `framework.cache.get (<key (string)>)`

We can see the framework cache in use by looking at the code that appears towards the top of the application router:
**Code snippet from [web/router.js](https://github.com/voyzu/voyzu-flights-01/tree/main/web/router.js):**

```javascript
  // retrieve some handy values from the cache. These values are set when the framework first initializes.
  const webDir = framework.cache.get('webDir');
  const config = framework.cache.get('config');
  const pkg = framework.cache.get('pkg');
  const redisClient = framework.cache.get('redisClient');
```

As we saw in the above "Voyzu Flights built-in functionality" code, upon initialization the framework sets `const appValues = await framework.devops.init.initializeComponent`, these `appValues` are set to the cache where they can be retrieved wherever needed.

### Working with models

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01#working-with-models)

Models are a powerful feature of the Voyzu Framework that allow you to define your own data structures. For an example consider the below code

**Code snippet from [web/routes/#flight#{id}#GET/index.js](https://github.com/voyzu/voyzu-flights-01/blob/main/web/routes/%23flight%23%7Bid%7D%23GET/index.js):**

```javascript
import { schema as flightSchema } from '../../../logic/models/flight.js';

const flight = framework.model.generateModel(crud.getFlight(pathParams.id), flightSchema);
```

The above code retrieves a flight using the "id" parameter in the URL and generates an object that conforms to the schema defined in the flight-schema import. The flight-schema import defines the flight model:

**Code snippet from [logic/models/flight.js](https://github.com/voyzu/voyzu-flights-01/tree/main/logic/models/flight.js):**

```javascript
export const schema = {
    airline: { type: "string" },
    arrivalDate: { type: "string" },
    arrivalTime: { type: "string" },
    flightLength: { type: "number" },
    flightNumber: { type: "string" },
    id: { required: true, type: "string" },
    origin: { type: "string" },
    processed: { defaultValue: false, type: "boolean" }
};
```

Using models means you can have confidence that the data you are working is as you expect. For example we can be sure that the flight will contain an `id` property after calling `generateModel` as this property is required.

### Web server and routing

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01#web-server-and-routing)

As explained in the framework documentation, a file named `index.js` created in a folder in the `web/routes` directory will automatically be served, provided you follow the naming convention of replacing forward slashes (`/`) with hashes (`#`) and appending the HTTP verb (e.g. GET, POST etc). In addition, you can enclose variables within curly brackets (`{}`) and they will be passed to your routes index.js file as path parameters

To illustrate this will an example, consider the index file located within `/web/routes/#flight#{id}#GET`. As per the naming convention GET requests to /flights/{id} (e.g a request to /flights/123) will be served by this file. The id in the url will be passed into an `id` parameter. This parameter is used in the index file to obtain the flight from the in-memory data store:

**Code snippet from [web/routes/#flight#{id}#GET/index.js](https://github.com/voyzu/voyzu-flights-01/blob/main/web/routes/%23flight%23%7Bid%7D%23GET/index.js):**

```javascript
const flight = framework.model.generateModel(crud.getFlight(pathParams.id), flightSchema);
```

### Serving web pages

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01?tab=readme-ov-file#serving-web-pages)

Lets again use the `index.js` file located within `web/routes/#flight#{id}#GET` as an illustrative example. This file receives the http request passed to it by router.js, a context object and any path parameters. It is responsible for returning the html for this route, which must be placed in the `response_data` field of an [http-response](https://github.com/voyzu/voyzu-framework-01/blob/main/src/models/http-response.js) object.

**Code snippet from [web/routes/#flight#{id}#GET](https://github.com/voyzu/voyzu-flights-01/blob/main/web/routes/%23flight%23%7Bid%7D%23GET/index.js):**

```javascript
/**
 * Route entry point.
 * @param {object} httpRequest An object conforming to the http-request model.
 * @param {object} context The context passed by vserver or vmock.
 * @param {object} pathParams An object with all path parameters passed to this route.
 * @returns {object} An object conforming to the http-response model.
 */
export async function fulfill(httpRequest, context, pathParams) {

  // ... process request by obtaining html for this route ...

  // generate the HTML to return to the router, injecting values
  const html = nunjucks.renderString(templateHtml, {
    airlines: airlinesForSelect,
    flight: JSON.stringify(flight),
    footerHtml,
    headerHtml,
    jsCode,
    navHtml,
    pageDescription: `page generated by voyzu framework component ${pkg.name} ${pkg.version} build ${buildNumber}`,
    pageHeading: 'Update flight',
    saveMethod: 'PUT',
    saveUrl: '/api/flights'
  });

  // return an http response containing the generated HTML
  return framework.model.generateModel({
    http_code: 200,
    response_data: html,
    response_type: framework.enums.HTTP_RESPONSE_TYPE.HTML
  }, framework.models.httpResponse);
```

The index page in this example, reads the HTML template from file, calculates various values and then injects these values into the HTML using the [nunjucks](https://mozilla.github.io/nunjucks/) NodeJS templating engine. This is a pattern Voyzu Flights uses, there is no framework functionality in view here.

Client side, the HTML file used as a template is a reasonably conventional HTML file, with dynamic values expressed using the nunjucks double curly braces format.

**Code snippet from [web/templates/flight.html](https://github.com/voyzu/voyzu-flights-01/blob/main/web/templates/flight.html):**

```html
  <div class="container">

    <!-- site header -->
    {{headerHtml}}

    <!-- site (left hand) navigation -->
    <nav>
      {{navHtml}}
    </nav>
    <main>
      <h3 style="margin-bottom: 10px;">{{pageHeading}}</h3>

      <!-- ... html code ... -->

      <!-- injected JavaScript code -->
      {{jsCode}}
    
```

Values enclosed in double curley braces (`{{ ... }}`) are replaced at run time with values injected by the index.js page. The `{{jsCode}}` tag is replaced by javascript code generated by the framework and injected by the index.js page - this code contains function useful for data-binding that relies on the [shoelace](https://shoelace.style) web components library. This library is simply called by the HTML page using CDN links:

**Code snippet from [web/templates/flight.html](https://github.com/voyzu/voyzu-flights-01/tree/main/web/templates/flight.html):**

```html
  <!-- Shoelace -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.19.0/cdn/themes/light.css" />
  <script type="module" src="https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.19.0/cdn/shoelace.js"></script>
  ```

### Workflows

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01/tree/main?tab=readme-ov-file#workflows)

Workflows are a powerful feature of Voyzu Framework compatible applications that allow asynchronous processing. Workflows are built on Redis keys and Redis pub / sub

#### Workflow vs Workflow Execution

In framework terminology a "workflow" is a logical grouping of functionality that performs an operation, or multiple operations. A "workflow execution", as the name implies is an execution of a given workflow. So Voyzu Flights has a single workflow - "process-flights", and that workflow can be executed multiple times, by multiple users. Each time the workflow is started a "workflow execution" is started.

Workflow executions are identified and tracked using the `request_id` property of the `workflow-job` model. Each workflow execution must have a unique request_id.

#### The sample application "process flights" workflow

Voyzu Flights includes a "process flights" workflow, this is a three step workflow with each step marking a certain portion of all flights as "processed". Of course it would be simpler to simply mark all flights as "processed" in a single workflow step, the workflow is broken into three steps purely to demonstrate a multi-step workflow.

The `process-flights` workflow resides within its own folder that sits in `workflows` which in turn sits in the top level `workflow` folder. If you look in the `workflow` folder you will also see a `router.js` file. This file routes events sent by the application subscription listener to the appropriate workflow and workflow step.

To start a workflow execution for the process-flights workflow requires creating a workflow job and publishing this job to the application's Redis channel. This is done within the `#api#workflow#process-flights#POST` route. When a user clicks 'Process flights' in the UI, a POST request is made to this route, which maps to `/api/process-flights`

**Code snippet from [/web/routes/#api#workflow#process-flights#POST](./web/routes/%23api%23workflow%23process-flights%23POST/index.js):**

```javascript
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
```

- The framework `publishWorkflowJob(...)` method creates a Redis key that stores the Workflow job and publishes the key name as event data to the application's redis channel
- This event is on-sent to `/workflow/router.js` which in turn send the event to the appropriate workflow and step.
- Once a key has been processed it is deleted.

#### Tracking Workflow Status

As above, Redis keys are created for each step in a workflow execution. This means that workflow execution progress can be derived from which keys are in existance. For example if a key ending in `02-even-numbers` exists, then the workflow execution is currently at step 2. If there are no remaining keys then the workflow is complete. A file named `progress.js` at the root of the `process-flights` directory examines the Redis keys that exist for a given workflow execution and returns a JSON object with workflow execution status information.

The `getProgress()` method of this file is called by the `api/workflow/process-flights/{requestId}` path, which is in turn called by the process-flights HTML page which displays progress of workflow execution to the user.

### Mocking

A Voyzu Framework compatible application is event driven. For example:

- browser events are received and HTML web pages sent
- api events are received and JSON responses sent
- Redis subscription events are received and processed.

Sometimes is is useful to simulate the processing of a single event. This can be useful for example if you encounter a production bug. You can copy the problematic event from production logs and then replay that single event.

#### Mocking web events

To mock a web event run:

```shell
npm run mock-web [event name] -- --<arguments>
```

Where `[event name]` is the name of the json file (residing in /mock/events) that contains the event you want to mock. The two sets of double dashes (`-- --`) are necessary because of the way npm works, it will "swallow" the first two parameters and only pass parameters that appear after the first set of --

Events that can be mocked must reside within the `/mock/events` folder, and they can be called as the first parameter (without dashes) in a call to `npm run mock-web`. For example you would mock an event named `production-bug.json` as `npm run mock-web production-bug` (the ".json" can be omitted). If no mock file name is passed then "default.json" will be assumed.  So `npm run mock-web` is equivalent to running `npm run mock-web default` which is equivalent to running `npm run mock-web default.json`

Similar to the framework web server, the framework mocking engine calls `/web/router.js`, passes in the event and receives and displays the http response returned by router.js. In this way you can have confidence that mocking is exactly simulating the way your application runs in production.

The Voyzu Flights "mock" folder contains an event named `nginx.json` which is a (slightly sanitized) actual event received in production from an nginx web server. If you run `npm run mock-web nginx` You will see the various application outputs and then a message saying that the response was saved to a file named "...voyzu-flights-01\mock\output\flights\index.html". This is standard mocking functionality, output is saved to a file that mirrors the actual URL path.

Why was the output saved to a folder named `flights`? This is because the mock event was a call to `https://voyzu-flights.voyzu.net/flights`. We can tell which route processed our mock event by examining our `nginx.json` file. We see towards the end of the file:

**Code snippet from [mock/events/nginx.json](https://github.com/voyzu/voyzu-flights-01/tree/main/mock/events/nginx.json):**

```json
    "route": {
      "file_friendly_route": "#flights#GET"
```

This is standard Voyzu Framework functionality in action: URLs are parsed by the framework web server and parsed to an `http-request` model containing a `route` node that contains the file friendly route

The framework mocking engine accepts other optional parameters, for a list of these enter `npm run mock-web -- --help` at the command line

#### Mocking workflow events

To mock a workflow event first make sure the application is running and serving requests, and the run:

```shell
npm run mock-workflow [event name]
```

Where `[event name]` is the name of the json file (residing in /mock/events) that contains the event you want to mock.

When a workflow event is mocked the event is published to the application's Redis channel. Thus the application must be running to sucessfully mock workflow events

### Authorization

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01?tab=readme-ov-file#authorization)

If you examine the Voyzu Flights `router.js` file you will find the code:

**Code snippet from [web/router.js](https://github.com/voyzu/voyzu-flights-01/tree/main/web/router.js):**

```javascript
  // Authorize this call
  const auth = await framework.web.auth.getSessionAuthorization(httpRequest, config, pkg.name, redisClient);

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
```

If you have enabled `bypassAuth` within config.js then authorization will always succeed because the `framework.web.auth.authorize` method examines the `config.js` file passed, finds that `bypassAuth` is true and therefore returns an authorization object with `authorized` set to true.

If you are looking to implement authentication in your framework compatible app, you can see an example of a simple user / password based authorization call in the authorization sample:

**Code snippet from [samples/auth.js](https://github.com/voyzu/voyzu-flights-01/tree/main/samples/auth.js):**

```javascript
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
```

The `framework.web.auth.authorizeAndCreateSession(...)` call will examine the authorization object returned from your custom function, and if successful create a session within Redis. A `cookie` string property containing the session id is added to the authorization object returned by your custom function, this can be passed in your http response.

Using these building blocks you could build out a user name / password based authentication scheme for your application

### Configuration

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01?tab=readme-ov-file#configuration)

We have already seen one config setting in action (`bypassAuth`) - another setting that is is worth drilling down on is the `hotReload` setting. When the `config.js` file is automatically created on first application launch this setting is set to false.

In a development environment however hot reloading is quite helpful, as it allows you to make changes on the fly i.e. without stopping and then restarting the built-in web server.. To test this out:

- Edit your `config.js` file and set `hotReload` to true
- Start the built-in web server by navigating to the Voyzu Flights directory and running `npm start` from the command line
- In a web browser open `localhost:2500`. You will see the application home page
- In your code editor make a change to `/web/routes/#GET/index.html`. The "#GET" file friendly route maps to a GET request to `/` and is therefore your application's index page. `index.html` is the HTML template that contains the content for this page
- Make a change to index.html, for example change `<h3>Home</h3>` to `<h3>Home Hot Reloaded!</h3>` or whatever text you wish
- Refresh your web browser e.g. by pressing F5. You should see your updated heading.

Note that hot reloading will apply any changes made to router.js and your web/routes files. Libraries you load, including internal modules will not be hot reloaded. For example if you make a change to a file within the /logic application directory you will need to stop (Ctrl C) and then re-start the web server. This is because NodeJS will automatically cache all modules imported. Similarly if you make a configuration change (i.e. modify `config.js`) you will need to re-start the web server.

**Important** Never leave hot reloading on in a production environment as hot reloading explicitly bypasses the built in NodeJS built-in caching mechanism, and therefore leaks memory. Leaving the `hotReload` config key as true in a production environment will over time crash your server. You have been warned!

### Logging

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01?tab=readme-ov-file#logging)

The framework allows logging from any part of an application through the `framework.devops.log` module.  

You can see various logging calls made throughout Voyzu Flights. For example `/web/router.js` logs (depending on settings in `config.js`) the http request received, the authorization object returned and the http response returned. See for example this code in `router.js`:

**Code snippet from [web/router.js](https://github.com/voyzu/voyzu-flights-01/tree/main/web/router.js):**

```javascript
// Import the Voyzu Framework
import framework from 'voyzu-framework-01';

// Module constants
const log = framework.devops.log;

// Log http request received, depending on config settings
if (config.logEvent && (config.logPublicRoutes === true || (config.logPublicRoutes !== true && httpRequest.route.file_friendly_route.split('#').find(Boolean) !== 'public'))) {
    log.debug(`received request`, httpRequest.request_id, event);
}
```

This code will log the http request received, provided that `logEvent` is set to true in application config. If the event is a request for a public path (e.g. for a .css file) then the event will only be logged if the `logPublicRoutes` setting is on. This is the case to avoid cluttering the console and logs with requests for styling files which generally do not contain any logic worth noting.

You can of course use framework logging functionality however you wish within your application, simply by calling your desired `log` method.

### Helper classes

[Voyzu Framework documentation](https://github.com/voyzu/voyzu-framework-01#helper-classes)

The framework includes a number of helper classes, these can be used anywhere in your application. You can see one of these helper functions in use within `logic/crud/crud.js`:

**Code snippet from [logic/crud/crud.js](https://github.com/voyzu/voyzu-flights-01/tree/main/logic/crud/crud.js):**

```javascript
export function createFlight(flight) {
    if (!flight.id) {
        flight.id = framework.helpers.cryptoHelper.generateRandomString(ID_LENGTH);
    }
```

Here the `cryptoHelper` module is used to generate a random string of a specified length

## CSS / Site styling

The Voyzu Framework does not include any specific functionality in terms of CSS or site styling

Voyzu Flights styles web pages using three CSS files. Within the `<head>` section of all HTML pages you will see:

```html
  <!-- site global css -->
  <link rel="stylesheet" href="/public/css/root.css">
  <link rel="stylesheet" href="/public/css/layout.css">
  <link rel="stylesheet" href="/public/css/style.css">
```

- `root.css` contains global CSS variables
- `layout.css` contains CSS that relates to site layout, such as size and positioning
- `style.css` contains CSS that relates to side appearance such as font and color

These routes are served as per standard Voyzu Framework routing. For example the code that serves `/public/css/root.css` can be found in the `index.js` module within the file friendly route of `#public#css#root.css#GET`.

As an aside, note authorization is not attempted for all paths that start with "public". Also `router.js` code is such that requests to public paths will not be logged unless `logPublicRoutes` is set to true in your application config.

## Creating your own Voyzu Framework compatible web application

As stated in the introduction, Voyzu Flights serves to demonstrate many of the Voyzu Framework's capabilities, but also it can act as a template upon which you can base your own Voyzu Framework compatible application.

Before we begin, choose the name of your primary business object. To explain further: in Voyzu Flights the primary business object is called `flight`. If you were creating a user management system your business object would be called `user`. If you were creating a blog management system your business object would be called `blog`. For the sake of example the primary business object we will use in the below instructions is "movie"

- Create a new folder named `movies`
- Copy all voyzu-flights-01 files and folders _except_ the `.git` and `node_modules` folders into this new folder
- cd into your new `movies` folder and run `npm install`
- Navigate to `/scripts/replace.js` and look for the section of code towards the top of this module that replaces "flight" with "movie" and "Flight" with "Movie". Change "movie" to your primary business object name
- Run the replacement script by entering `node scripts/replace.js` from the application root. All files and folders will be renamed
- Enter `npm start` and browse to localhost:2500
- If you receive an "unauthorized" error, un-comment the `bypassAuth` setting in `config.js` and restart the web server process

At this point you will have your primary business object but it will still have the flight properties (airline, flight number etc). The logical next step would be to edit the model definition file that resides in `/logic/models` and add your own attributes. From there you can add new models, add routes, add your own workflows and so on.

## Deployment to production

Below are instructions to deploy your new Voyzu Framework compatible application to a brand new Linux server. The Voyzu Framework has been tested on Ubuntu 24 LTS.

These instructions assume you can SSH into your target server using an SSL certificate with a user that has sudo permissions

- **Ensure your application exists as a github repository**

  The framework install process uses github to pull down files into the target environment, thus your applicaiton must exist in github. If your application is not already in github, general instructions to do this are:

  - First create the new repository in github with the same name as your applicaiton folder (e.g. "movies" if you were following the example instructions above). Take note of the repository URL

  - Then:

    ```shell
    git init
    git add .
    git commit -m "Initial commit"
    git remote add origin <URL>
    git push -u origin main
    ```
  
  You also need to make sure that the url of your repository is correct in your package.json file, as this is the url the framework deployment process will use. Within your package.json file you will see an entry similar to:

  ```json
      "repository": {
          "type": "git",
          "url": "git@github.com:voyzu/voyzu-movies-01.git"
      }
  ```

  Change the github repository to your own github account and repo name. The repository name in the `url` field (`voyzu-movies-01` in the example above) must be the same as your package name

- **Add your server SSH details to config.js**

    In order to make use of the automated deployment script (`/deploy/deploy.js`) you will need to add SSH details to the application `config.js` file. Edit the `config.js` and edit the below section, replacing placeholder values with your values:

    ```javascript
    ssh: {
            default: {
                host: '123.456.789.123', // SSH server address
                port: 22, // SSH server port
                username: 'username', // SSH username
                privateKeyPath: '~/.ssh/prod-rsa' // Path to the private key
            }
        }
    ```

- **Install Voyzu Framework prerequisites**

    On your target server, install the Voyzu Framework pre-requisites:

  - Install NodeJS version 18 or above
  - Install npm 10 or above (this should have been installed when you installed NodeJS. Use `npm -v` to check the version)
  - Install Redis

- **Install the Voyzu Framework**

  - SSH into your server and navigate to your home directory.
  - Git clone the the voyzu-framework-01 repository
  - `cd voyzu-framework-01`
  - `npm install`

- **Run your component's automated deployment script**

    Voyzu Flights comes with its own deployment script, which makes use of the Voyzu Framework's built-in deployment capabilities. This script is called `deploy.js` and it lives in the `/deploy` top level folder. When you copied your new component from Voyzu Flights this file will have been copied across.

    From your component's root directory, on the command line, enter

    ```bash
    npm run deploy -- --new
    ```

    The two sets of double dashes are needed to pass the "new" parameter due to the way npm will swallow the first set of double dashes.

    Running this command will invoke this `deploy.js` script and will perform a number of actions on both your localhost and the remote server. At a high level the deployment script will:

  - Increment the build number stored in `build.json` (this file will be created if it doesn't exist)
  - Check the application source code into github with an automated commit message
  - On the remote server, within the SSH user's home directory, clone the application's github repository
  - On the remote server run `npm install`
  - On the remote server create a new "systemd" service file that runs the application

- **Change any config.js values you need to**

  - cd to your new component's folder on the remote server
  - Open the `config.js` file and change any values you need to. For example if Redis uses a different port on the remote server then this will need to be changed.
  - Re-start the NodeJS application process to apply any config changes by running `sudo systemctl restart voyzu-flights.service`

- **Validate deployment**

  - SSH into the remote server and run `curl localhost:2500` where 2500 is the port number as per `config-default.js`
  - If the curl command returns the expected HTML output then you know your component has been deployed successfully and is running

- **Connect your running service to the outside world**

    At this point you have a running nodejs service listening for http requests on port 2500. The final step is to connect this service to the outside world. Instructions here are for nginx, but any web server e.g. Apache could be used for this purpose

  - Install nginx onto your server
  - Create a new nginx ".conf" file. The recommended way to achieve this to create a file named `<target domain name>.conf` and store it in `/etc/nginx/sites_available`, and then create a symlink in `/etc/nginx/sites_enabled` pointing to this file
  - Paste in the contents of your component's `/deploy/nginx.conf` file. Change the domain to the domain you want to serve your application on. Note that for this to work you need to have a DNS "A" record pointing to your server's IP address (for example using CloudFlare)
  - Enable SSL, for example using Certbot
  - Restart nginx to apply changes. `sudo systemctl restart nginx`
  - You should now be able to access voyzu flights on your chosen domain name. Well done :-)

### Deploying updates to your component

With the component deployed, deploying updates to the component is straightforward. To deploy an updated version of your component run `npm run deploy` from the command line.

## Development

### Linting

To lint your application using eslint run `npm start lint` which will call the "lint" entry in "package.json"

**Code snippet from [package.json](https://github.com/voyzu/voyzu-flights-01/tree/main/package.json):**

```json
"scripts": {
    "lint": "cd src && npx eslint . --fix",
```

Linting will use the `eslint.config.js` file which defines initial linting rules. These can of course be changed to suit your eslint preferences.

### Updating dependencies

To update your dependencies run `npm run update-deps` which will call the "update-deps" entry in "package.json"

**Code snippet from [package.json](https://github.com/voyzu/voyzu-flights-01/tree/main/package.json):**

```json
"scripts": {
        "update-deps": "npx updates -u -m && npm install"
```

The `-m` flag restricts updating to minor versions of dependencies. Remove this flag if you are OK with updating dependencies to the latest major version available.
