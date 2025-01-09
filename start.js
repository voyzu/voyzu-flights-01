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
