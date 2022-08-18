const exec = require('child_process').exec;
const fs = require('fs');

const core = require('@actions/core');
const github = require('@actions/github');

var execProcess = function (command) {
    var child = exec(command, function (err, stdout, stderr) {
        if (err != null) {
            return new Error(err);
        } else if (typeof (stderr) != "string") {
            console.log(stderr);
            return new Error(stderr);
        } else {
            console.log(stdout);
            return stdout;
        }
    });
}

const repositoryLocation = `${process.env['RUNNER_TEMP']}/orchestrator-repo`


function run() {
    try {
        // `who-to-greet` input defined in action metadata file
        const orchestrator = core.getInput('orchestrator');
        const repository = encodeURIComponent(github.context.payload.repository.url);
        console.log(`Notifying that ${repository} is complete`);

        // clone the orchestrator repo
        console.log(`Cloning ${orchestrator} to ${repositoryLocation}`);
        execProcess(`git clone ${orchestrator} ${repositoryLocation}`);
        // find all dependencies of url

        // broadcast a build message to each
        const upstreamFolder = `${repositoryLocation}/upstream/${repository}`;
        console.log(`Reading dependencies from ${upstreamFolder}`);
        if (fs.existsSync(upstreamFolder)) {
            fs.readdirSync(upstreamFolder).forEach(file => {
                console.log(file);
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