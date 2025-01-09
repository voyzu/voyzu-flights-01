/* eslint "no-useless-escape":"off" */

// Core node modules
import path from 'node:path';

// Voyzu framework
import framework from 'voyzu-framework-01';

// Module constants
const { execRemote } = framework.devops.exec;

deploy();

/**
 * Deploy this component to a remote server via SSH.
 */
export async function deploy() {

    const appValues = await framework.devops.init.initializeComponent(false, false);

    if (!appValues) {
        // Initialization hasn't worked
        // Initialization will take care of its own errors, just exit
        return;
    }

    const { cmdName, componentDir, pkg, config } = appValues;

    const args = await framework.devops.deploy.parseDeploymentArgs(cmdName);

    if (!args) {
        return;
    }

    const deployContext = await framework.devops.deploy.getDeployContext(config, pkg);

    if (!deployContext) {
        return;
    }

    const { repo, sshConfig, user } = deployContext;

    try {
        await deployScript(cmdName, componentDir, pkg, config, sshConfig, args, repo, user);
        console.log(`✅ SCRIPT COMPLETES`);
    } catch (error) {
        console.error(`❌ SCRIPT ERROR`);
        console.error(error);
    }
}

async function deployScript(cmdName, componentDir, pkg, config, sshConfig, args, repo, user) {

    const { version } = pkg;
    const service = `${pkg.name}.service`;

    const buildNumber = framework.devops.deploy.incrementBuildNumber(path.join(componentDir, 'build.json'));

    console.log(`[${pkg.name}] deploying version ${version} build ${buildNumber} to /home/${user} pulling ${repo}`);

    if (framework.helpers.objectHelper.isEmpty(args)) {
        console.log(`[${pkg.name}] deploying with no arguments passed`);
    } else {
        console.log(`[${pkg.name}] deploying with arguments ${JSON.stringify(args)}`);
    }
    console.log();

    await framework.devops.deploy.gitAddCommitPush(version, buildNumber);

    await (args.new ? execRemote(`
                            echo "git clone into $(pwd)"
                            git clone ${repo}
                        `, sshConfig) : execRemote(`
                            cd ${pkg.name} || exit 1 
                            echo "git pull into $(pwd)"
                            git pull
                        `, sshConfig));

    if (args.new || args.deps) {
        // pull and install this repo
        await execRemote(`
                            cd ~/${pkg.name}
                            echo "npm install into $(pwd)"
                            npm install --omit=dev
                        `, sshConfig);

        // Pull and install the Voyzu Framework
        // The voyzu framework must first be manually deployed onto the target server
        await execRemote(`
                            cd ~/voyzu-framework-01
                            echo "git pull into $(pwd)"
                            git pull
                            echo "npm install into $(pwd)"
                            npm install --omit=dev
                    `, sshConfig);
    }

    if (args.new || args.replaceService) {
        await execRemote(`
                        # validate - get the installed version
                        cd ~/${pkg.name}
                        serverVersion=\$(npm pkg get version | tr -d '"')
                        echo "deployed new component ${pkg.name} \$serverVersion"
                        echo "creating ${service}"
                        `, sshConfig);

        await execRemote(`
echo "[Unit]
Description=${pkg.name} nodejs service

[Service]
ExecStart=npm start
Restart=always
User=${user}
WorkingDirectory=/home/${user}/${pkg.name}
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target" | sudo tee /usr/lib/systemd/system/${service}`, sshConfig, true);

        await execRemote(`
                        #  Reload the systemd daemon
                        sudo systemctl daemon-reload

                        # Enable the service to start on boot
                        sudo systemctl enable ${service}

                        # Start the service
                        sudo systemctl restart ${service}

                        # we're done
                        echo "created ${service}"
            `, sshConfig);
    } else {
        await execRemote(`
                        cd ~/${pkg.name}
                        serverVersion=$(npm pkg get version | tr -d '"')
                        sudo systemctl restart ${service}
                        echo "deployed ${pkg.name} \$serverVersion sevice $service restarted."
            `, sshConfig);
    }
}