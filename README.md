# Github Dependency Actions

Actions related to github dependencies

# Job Complete

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

## Inputs

## `orchestrator`

**Required** The repository being used for orchestration

## `repository`

**Required** The repository calling this action

## Example usage

uses: actions/github-dependencies/register-dependencies@v1.1
with:
  orchestrator: github.com/YourOrg/orchestrator-repo