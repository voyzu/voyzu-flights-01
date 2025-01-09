// Core nodejs modules
import * as url from 'node:url';
import path from 'node:path';

// Voyzu framework
import framework from "voyzu-framework-01";

// Get some initial values that the authorization function needs
// We need to pass a component directory to initialization as process.cwd() doesn't work for adhoc execution
const thisDir = url.fileURLToPath(new URL('.', import.meta.url));
const componentDir = path.join(thisDir, '..');
await framework.devops.init.initializeComponent(false, true, componentDir);

const {log} = framework.devops;

log.debug('hello world', 'request123', { hello: 'world' });

const extraErrorData = { the: 'root cause' };
const error = new Error('oops!');

log.error('it did not work :-(', 'req 123', error, extraErrorData);
