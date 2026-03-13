# Bokeh GitHub Actions Workflows

This directory contains the CI/CD workflows for the Bokeh project.

## Overview of Workflows

### Core CI Workflows

#### `bokeh-ci.yml` - Standard CI
The primary CI workflow that runs on every push and pull request. Tests the most common configurations to provide fast feedback.

- **Triggers**: Push to branches, pull requests
- **Coverage**: Common platform/Python combinations
- **Purpose**: Fast feedback for regular development

#### `bokeh-ci-comprehensive.yml` - Comprehensive Testing
A thorough test suite that runs across **all platforms × all Python versions** (37 jobs total).

- **Triggers**:
  - Scheduled: Weekly on Sundays at 2 AM UTC
  - Manual: Via workflow_dispatch (see below)
- **Coverage**:
  - All platforms: Ubuntu (24.04, 22.04), macOS (latest, 13), Windows (latest)
  - All Python versions: 3.10, 3.11, 3.12, 3.13, 3.14
  - Test suites: Minimal deps, core deps, full test suite
  - Builds: Conda packages and wheels for all platforms
- **Purpose**: Ensure compatibility across the entire support matrix
- **Artifacts**: Uploads conda packages and wheels for inspection

**To manually trigger the comprehensive workflow:**

1. Go to the [Actions tab](https://github.com/bokeh/bokeh/actions) in the repository
2. Select "Bokeh-CI-Comprehensive" from the workflow list on the left
3. Click the "Run workflow" button (top right)
4. Optionally provide a reason for the manual run
5. Click "Run workflow" to start

Only maintainers with write access can manually trigger workflows.

### BokehJS Workflows

#### `bokehjs-ci.yml` - BokehJS Tests
Tests the JavaScript/TypeScript codebase.

- **Triggers**: Push to branches, pull requests affecting `bokehjs/`
- **Tests**: Unit tests, integration tests, linting, type checking

#### `bokehjs-test-chromium.yml` - Browser Testing
Runs BokehJS tests in Chromium browser environment.

### Release Workflows

#### `bokeh-release-build.yml` - Release Builds
Builds release artifacts (conda packages, wheels) when a tag is pushed.

- **Triggers**: Git tags matching version patterns
- **Outputs**: Production-ready packages

#### `bokeh-release-deploy.yml` - Release Deployment
Deploys built releases to PyPI, conda-forge, etc.

- **Triggers**: Successful completion of release build
- **Requires**: Release manager credentials

### Maintenance Workflows

#### `codeql-analysis.yml` - Security Analysis
Runs GitHub CodeQL for security vulnerability detection.

#### `downstream.yml` - Downstream Testing
Tests compatibility with downstream packages that depend on Bokeh.

#### `lock-threads.yml` - Thread Locking
Automatically locks old inactive threads to keep discussions focused.

## Common Tasks

### Running Tests Locally

Before pushing, you can run local tests to match CI:

```bash
# Python tests
pytest tests/

# BokehJS tests
cd bokehjs
node make test

# Linting
ruff check src/bokeh tests/
cd bokehjs && node make lint
```

### Viewing Workflow Runs

- Navigate to the [Actions tab](https://github.com/bokeh/bokeh/actions)
- Select a workflow from the left sidebar
- Click on a specific run to see details, logs, and artifacts

### Downloading Artifacts

Some workflows upload build artifacts (wheels, conda packages):

1. Open the workflow run
2. Scroll to the "Artifacts" section at the bottom
3. Click to download

Artifacts are available for 90 days after the workflow run.

### Troubleshooting Failed Workflows

1. **Check the logs**: Click on the failed job and expand the failing step
2. **Reproduce locally**: Use the same commands shown in the workflow
3. **Check for flaky tests**: Re-run the workflow to see if it passes
4. **Platform-specific issues**: Check if failures are on specific OS/Python combos

## Workflow Configuration

### Environment Variables

Common environment variables used across workflows:

- `CHROME_VER`: Chrome version for browser testing
- `CHROME_REV`: Chrome revision identifier
- `BOKEHJS_ACTION`: Controls BokehJS build behavior (build/install)

### Composite Actions

Reusable workflow steps are defined in `.github/workflows/composite/`:

- `build`: Builds Bokeh and BokehJS
- Additional composite actions for common tasks

## For Maintainers

### When to Run Comprehensive CI

The comprehensive workflow automatically runs weekly, but you may want to trigger it manually:

- **Before major releases**: Verify all platform/version combinations
- **After dependency updates**: Ensure compatibility across the matrix
- **When investigating platform-specific bugs**: Get complete coverage
- **Before merging high-impact changes**: Extra confidence for risky changes

The comprehensive workflow provides the highest confidence but takes longer to run (all 37 jobs).

### Workflow Permissions

Most workflows use the default `GITHUB_TOKEN` permissions. Release workflows require additional secrets configured in repository settings.

## Contributing

When modifying workflows:

1. Test changes in a fork first when possible
2. Use `workflow_dispatch` for testing new workflows
3. Document any new environment variables or secrets
4. Update this README when adding or modifying workflows
5. Consider the impact on CI run time and GitHub Actions quota
