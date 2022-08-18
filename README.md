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
  orchestrator: github.com/YourOrg/orchestrator-repo


# Register Dependencies

## Environment variables

### `GIT_SSH_TOKEN`

**Required** The token that has write access to the orchestrator repository

## Inputs

### `orchestrator`

**Required** The repository being used for orchestration

### `dependencies`

**Required** The list of newline separated repositories that will be registered as upstream of the calling repo

## Example usage

uses: actions/github-dependencies/register-dependencies@v1.1
with:
  orchestrator: github.com/YourOrg/orchestrator-repo
  dependencies: |
    https://github.com/YourOrg/yourrepo
    https://github.com/YourOrg/yourrepo2