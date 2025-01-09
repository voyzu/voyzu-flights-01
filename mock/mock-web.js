// Import voyzu framework
import framework from "voyzu-framework-01";

mock();

async function mock() {
    // Parse out our execution context
    const appValues = await framework.devops.init.initializeComponent(true, true);

    if (!appValues) {
        // Initialization hasn't worked
        // Initialization will take care of its own errors, just exit
        return;
    }

    const { cmdName, componentDir, pkg, webDir } = appValues;

    // Parse and validate command line arguments
    const args = framework.devops.mock.parseMockWebArgs(cmdName);

    // Call framework mock method
    await framework.devops.mock.mockHttpRequest(cmdName, componentDir, webDir, pkg, args);

}
