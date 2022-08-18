const exec = require('child_process').execSync;
const fs = require('fs');

const core = require('@actions/core');
const github = require('@actions/github');

var execProcess = function (command) {
    var result = exec(command);
    return result.toString();
}

const repositoryLocation = `${process.env['RUNNER_TEMP']}/orchestrator-repo`

let gitSSHCommand = '';

function setupSSHKey() {
    const sshKey = core.getInput('ssh-key');
    if (sshKey) {
        const sshKeyPath = `${process.env['RUNNER_TEMP']}/key`;
        fs.writeFileSync(sshKeyPath, sshKey.trim() + '\n', { mode: 0o600 });
        gitSSHCommand = `GIT_SSH_COMMAND='ssh -i "${sshKeyPath}" -o "StrictHostKeyChecking no"'`;
        console.log("Using provided ssh-key");
    }
}

function prepareUrl(url) {
    const unencoded = url.replace(/(^\w+:|^)\/\//, '');
    return encodeURIComponent(unencoded);
}

function unprepareUrl(url) {
    const unencoded = decodeURIComponent(url);
    return 'https://' + unencoded;
}

function run() {
    try {
        // `who-to-greet` input defined in action metadata file
        const orchestrator = core.getInput('orchestrator');
        const unencodedRepository = github.context.payload.repository.url;
        console.log(`Notifying that ${unencodedRepository} is complete`);
        const repository = prepareUrl(unencodedRepository);

        // clone the orchestrator repo
        console.log(`Cloning ${orchestrator} to ${repositoryLocation}`);
        execProcess(`${gitSSHCommand} git clone --depth 1 ${orchestrator} ${repositoryLocation}`);
        // find all dependencies of url

        // broadcast a build message to each
        const upstreamFolder = `${repositoryLocation}/upstream/${repository}`;
        console.log(`Reading dependencies from ${upstreamFolder}`);
        if (fs.existsSync(upstreamFolder)) {
            fs.readdirSync(upstreamFolder).forEach(file => {
                console.log("Dependency found: ", unprepareUrl(file));
            });
        } else {
            console.log("No downstream dependencies found!")
        }

    } catch (error) {
        core.setFailed(error.message);
    }
}

function cleanup() {
    execProcess(`rm -r -y ${repositoryLocation} || true`);
}


// Main
if (!process.env['STATE_isPost']) {
    run()
}
// Post
else {
    cleanup()
}