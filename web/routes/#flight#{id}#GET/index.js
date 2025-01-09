// Core node modules
import fs from 'node:fs';
import path from 'node:path';

// Installed modules
import nunjucks from 'nunjucks';

// Voyzu framework
import framework from 'voyzu-framework-01';

// Modules from this component
import * as crud from '../../../logic/crud/crud.js';
import { schema as flightSchema } from '../../../logic/models/flight.js';

/**
 * Route entry point.
 * @param {object} httpRequest An object conforming to the http-request model.
 * @param {object} context The context passed by vserver or vmock.
 * @param {object} pathParams An object with all path parameters passed to this route.
 * @returns {object} An object conforming to the http-response model.
 */
export async function fulfill(httpRequest, context, pathParams) {

  // Retreive values from cache
  const pkg = framework.cache.get('pkg');
  const webDir = framework.cache.get('webDir');
  const buildNumber = framework.cache.get('buildNumber');

  // Read site header HTML
  const headerTemplatePath = path.join(webDir, 'templates', 'header.html');
  let headerHtml = fs.readFileSync(headerTemplatePath).toString();
  headerHtml = nunjucks.renderString(headerHtml, {});

  // Read site navigation HTML
  const navTemplatePath = path.join(webDir, 'templates', 'nav.html');
  let navHtml = fs.readFileSync(navTemplatePath).toString();
  navHtml = nunjucks.renderString(navHtml, {});

  // Read site footer HTML
  const footerTemplatePath = path.join(webDir, 'templates', 'footer.html');
  let footerHtml = fs.readFileSync(footerTemplatePath).toString();
  footerHtml = nunjucks.renderString(footerHtml, {});

  // Get javascript code from the framwwork to inject into the page
  let jsCode = '\n\n<script>';
  jsCode += framework.web.ui.alert.getCode();
  jsCode += `\n\n${framework.web.ui.binding.getCode()}\n\n`;
  jsCode += `\n\n${framework.web.ui.validation.getCode()}\n\n`;
  jsCode += '\n\n</script>\n\n';

  // Read the route template
  const templatePath = path.join(webDir, 'templates');
  const templateHtml = fs.readFileSync(path.join(templatePath, 'flight.html')).toString();

  // Build a list of airlines for the airlines drop down menu from the in-memory collection of flights
  const flights = framework.cache.get('flights');
  const airlines = [...new Set(flights.map(flight => flight.airline))];

  // The Shoelace select control doesn't like spaces as values - replace spaces with an underscore
  const airlinesForSelect = [];
  for (const airline of airlines) {
    airlinesForSelect.push({
      text: airline,
      value: airline.replaceAll(' ', '_')
    });
  }

  // Obtain the flight we are updating using the path parameter
  const flight = framework.model.generateModel(crud.getFlight(pathParams.id), flightSchema);

  // Generate the HTML to return to the router, injecting values
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

  // Return an http response containing the generated HTML
  return framework.model.generateModel({
    http_code: 200,
    response_data: html,
    response_type: framework.enums.HTTP_RESPONSE_TYPE.HTML
  }, framework.models.httpResponse);
}