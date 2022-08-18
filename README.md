# Github Dependency Actions

Actions related to github dependencies

# Job Complete

## Environment variables

## `GIT_SSH_TOKEN`

**Required** The token that has read access to the orchestrator repository

## Inputs

## `orchestrator`

**Required** The repository being used for orchestration

## `repository`

**Required** The repository calling this action

## Example usage

uses: actions/github-dependencies/job-complete@v1.1
with:
  orchestrator: github.com/YourOrg/orchestrator-repo


# Register Dependencies

## Environment variables

## `GIT_SSH_TOKEN`

**Required** The token that has write access to the orchestrator repository

## Inputs

## `orchestrator`

**Required** The repository being used for orchestration

## `repository`

**Required** The repository calling this action

## Example usage

uses: actions/github-dependencies/register-dependencies@v1.1
with:
  orchestrator: github.com/YourOrg/orchestrator-repo