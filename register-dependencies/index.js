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

const parseArray = function (val) {
    const array = val.split('\n');
    const filtered = array.filter((n) => n)

    return filtered.map((n) => n.trim())
}

const repositoryLocation = `${process.env['RUNNER_TEMP']}/orchestrator-repo`


function run() {
    try {
        // `who-to-greet` input defined in action metadata file
        const orchestrator = core.getInput('orchestrator');
        const workflow = core.getInput('workflow')
        const unencodedDependencies = parseArray(core.getInput('dependencies'));
        const unencodedRepository = encodeURIComponent(github.context.payload.repository.url);
        console.log(`Notifying that ${unencodedRepository} is complete`);
        const dependencies = unencodedDependencies.map(d => encodeURIComponent(d));
        const repository = encodeURIComponent(unencodedRepository);

        console.log(`Debug: ${repository}`, dependencies);

        // clone the orchestrator repo
        console.log(`Cloning ${orchestrator} to ${repositoryLocation}`);
        execProcess(`git clone ${orchestrator} ${repositoryLocation}`);

        // find the existing dependencies
        const dependencyFolder = `${repositoryLocation}/downstream/${repository}`;
        console.log(`Reading dependencies from ${dependencyFolder}`);

        const existingDependencies = [];
        if (fs.existsSync(dependencyFolder)) {
            fs.readdirSync(dependencyFolder).forEach(file => {
                existingDependencies.push(file);
            });
        }

        console.log("Existing Dependencies", existingDependencies);

        const newDependencies = dependencies.filter(x => !existingDependencies.includes(x));
        console.log("New dependencies", newDependencies);

        let changed = false;

        newDependencies.map(dependency => {
            changed = true;
            fs.mkdirSync(`${repositoryLocation}/downstream/${repository}`, { recursive: true });
            const newDownstreamPath = `${repositoryLocation}/downstream/${repository}/${dependency}`;
            fs.writeFileSync(newDownstreamPath, workflow, { flag: 'w' });

            fs.mkdirSync(`${repositoryLocation}/upstream/${dependency}`, { recursive: true });
            const newUpstreamPath = `${repositoryLocation}/upstream/${dependency}/${repository}`;
            fs.writeFileSync(newUpstreamPath, workflow, { flag: 'w' });
        })

        const defunctDependencies = existingDependencies.filter(x => !dependencies.includes(x));
        console.log("Old dependencies to remove", defunctDependencies);

        defunctDependencies.map(dependency => {
            changed = true;
            console.log("\tRemoving dependency", dependency);
            const oldDownstreamPath = `${repositoryLocation}/downstream/${repository}/${dependency}`;
            fs.rmSync(oldDownstreamPath);
            const oldUpstreamPath = `${repositoryLocation}/upstream/${dependency}/${repository}`;
            fs.rmSync(oldUpstreamPath);
        })

        console.log("status", execProcess(`cd  ${repositoryLocation} && git status`));
        if (changed) {
            console.log("Pushing to git");
            console.log("commit", execProcess(`cd  ${repositoryLocation} && git commit -a -m "Updating dependencies for ${unencodedRepository}`));
            console.log("commit", execProcess(`cd  ${repositoryLocation} && git push`));
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