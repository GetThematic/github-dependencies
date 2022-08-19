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

const dispatchWorkflow = async (octokit, owner, repo, workflow_id, reference, parameters) => {
    const dispatchResp = await octokit.request(`POST /repos/${owner}/${repo}/actions/workflows/${workflow_id}/dispatches`, {
        ref: reference,
        inputs: parameters
    });
    console.log(`API response status: ${dispatchResp.status} 🚀`);
}

function prepareUrl(url) {
    // remove the protocol and site (we only support github dependencies because this relies on github actions)
    const unencoded = url.replace(/(^\w+:|^)\/\//, '');
    const parts = unencoded.split('/');
    return encodeURIComponent(`${parts[1]}/${parts[2]}`);
}

function unprepareUrl(url) {
    const decoded = decodeURIComponent(url);
    const split = unencoded.split('/');
    return { 'owner': split[0], 'repo': split[1] };
}

function run() {
    try {
        // `who-to-greet` input defined in action metadata file
        const orchestrator = core.getInput('orchestrator');
        const token = core.getInput('github-token');
        const unencodedRepository = github.context.payload.repository.html_url;
        console.log(`Notifying that ${unencodedRepository} is complete`);
        const repository = prepareUrl(unencodedRepository);

        setupSSHKey();

        // clone the orchestrator repo
        console.log(`Cloning ${orchestrator} to ${repositoryLocation}`);
        execProcess(`${gitSSHCommand} git clone --depth 1 ${orchestrator} ${repositoryLocation}`);
        // find all dependencies of url

        // Get octokit client for making API calls
        const octokit = github.getOctokit(token);

        // broadcast a build message to each
        const upstreamFolder = `${repositoryLocation}/upstream/${repository}`;
        console.log(`Reading dependencies from ${upstreamFolder}`);
        if (fs.existsSync(upstreamFolder)) {
            fs.readdirSync(upstreamFolder).forEach(file => {
                const downstreamRepository = unprepareUrl(file);
                console.log("Dependency found: ", url);
                const workflow = fs.readFileSync(`${upstreamFolder}/${file}`);

                dispatchWorkflow(octokit, downstreamRepository['owner'], downstreamRepository['repo'], workflow, 'master', {});
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