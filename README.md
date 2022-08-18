# Github Dependency Actions

Github actions are missing a vital piece of the CI/CD puzzle: the ability to build workflows in downstream projects.

These actions overcome this by using an otherwise empty repository as a record of what the dependencies are between projects and allowing downstream projects to register what their dependencies are and upstream projects to build them when they are complete.

It does not handle circular dependencies or create the most optimal graph of dependency building. It is recommended to do this by using the `register-dependencies` action judiciously. 


# Job Complete

## Environment variables

### `GIT_SSH_TOKEN`

**Required** The token that has read access to the orchestrator repository

## Inputs

### `orchestrator`

**Required** The repository being used for orchestration

## Example usage

uses: actions/github-dependencies/job-complete@v1.1
with:
  orchestrator: git://github.com/YourOrg/orchestrator-repo.git


# Register Dependencies

## Environment variables

### `GIT_SSH_TOKEN`

**Required** The token that has write access to the orchestrator repository

## Inputs

### `orchestrator`

**Required** The repository being used for orchestration

### `dependencies`

**Required** The list of newline separated repositories that will be registered as upstream of the calling repo


### `workflow`

**Required** The name of the workflow to run (relative to .github/workflows)

## Example usage

uses: actions/github-dependencies/register-dependencies@v1.1
with:
  orchestrator: git://github.com/YourOrg/orchestrator-repo.git
  dependencies: |
    git://github.com/YourOrg/repo-1.git
    git://github.com/YourOrg/repo-2.git


# TODO
* Currently if the workflow registered with register-dependencies changes, it won't be updated correctly