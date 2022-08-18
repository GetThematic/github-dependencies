const exec = require('child_process').execSync;
const fs = require('fs');

const core = require('@actions/core');
const github = require('@actions/github');

var execProcess = function (command) {
    var result = exec(command);
    return result.toString();
}

const parseArray = function (val) {
    const array = val.split('\n');
    const filtered = array.filter((n) => n)

    return filtered.map((n) => n.trim())
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


function run() {
    try {
        // `who-to-greet` input defined in action metadata file
        const orchestrator = core.getInput('orchestrator');
        const workflow = core.getInput('workflow');

        setupSSHKey();

        const unencodedDependencies = parseArray(core.getInput('dependencies'));
        const unencodedRepository = encodeURIComponent(github.context.payload.repository.url);
        console.log(`Notifying that ${unencodedRepository} is complete`);
        const dependencies = unencodedDependencies.map(d => encodeURIComponent(d));
        const repository = encodeURIComponent(unencodedRepository);

        console.log(`Debug: ${repository}`, dependencies);

        // clone the orchestrator repo
        console.log(`Cloning ${orchestrator} to ${repositoryLocation}`);
        execProcess(`${gitSSHCommand} git clone --depth 1 ${orchestrator} ${repositoryLocation}`);

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

        console.log("status", execProcess(`git -C ${repositoryLocation} status`));
        if (changed) {
            console.log("Pushing to git");
            console.log("commit", execProcess(`git -C ${repositoryLocation} commit -a -m "Updating dependencies for ${unencodedRepository}`));
            console.log("commit", execProcess(`${gitSSHCommand} git -C ${repositoryLocation} push`));
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