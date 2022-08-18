const exec = require('child_process').exec;
const fs = require('fs');

const core = require('@actions/core');
const github = require('@actions/github');

var execProcess = function (command, cb) {
    var child = exec(command, function (err, stdout, stderr) {
        if (err != null) {
            return cb(new Error(err), null);
        } else if (typeof (stderr) != "string") {
            return cb(new Error(stderr), null);
        } else {
            return cb(null, stdout);
        }
    });
}

const repositoryLocation = `${process.env['RUNNER_TEMP']}/orchestrator-repo`


function run() {
    try {
        // `who-to-greet` input defined in action metadata file
        const orchestrator = core.getInput('orchestrator');
        const repository = github.context.payload.repository.url;
        console.log(`Notifying that ${repository} is complete`);

        // clone the orchestrator repo
        console.log(`Cloning ${orchestrator} to ${repositoryLocation}`);
        execProcess(`git clone ${orchestrator} ${repositoryLocation}`);
        // find all dependencies of url

        // broadcast a build message to each
        const upstreamFolder = `${repositoryLocation}/upstream/${repository}`;
        console.log(`Reading dependencies from ${dependencyFolder}`);
        fs.readdirSync(upstreamFolder).forEach(file => {
            console.log(file);
        });

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