# CI/CD

This project uses [GitHub Actions](https://docs.github.com/en/actions) for Continuous Integration and Delivery.

## Workflows

### CI Pipeline

**Trigger:** Push to `main`, pull requests targeting `main`

The CI pipeline validates code quality across multiple Node.js versions:

| Step                        | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| Checkout                    | Clones the repository                                  |
| Setup Node.js               | Configures Node.js (matrix: 22.x, 24.x)               |
| Setup Environment           | Configures pnpm and environment variables              |
| Cache Dependencies          | Caches `node_modules` using `pnpm-lock.yaml` hash      |
| Install Packages            | Runs `pnpm install --frozen-lockfile` (if cache miss)  |
| Build                       | Compiles all packages with TypeScript                  |
| Test                        | Runs the full test suite with coverage                 |
| Publish Coverage            | Uploads coverage report to [Codecov](https://app.codecov.io/gh/gradientedge/cdk-utils) (main branch, Node 24.x only) |
| Upload Docs Artifact        | Saves generated API docs for the release job           |

### Release Pipeline

**Trigger:** Successful push to `main` (runs after CI passes)

| Step                        | Description                                            |
| --------------------------- | ------------------------------------------------------ |
| Checkout                    | Clones the repository with full history                |
| Setup Node.js               | Configures Node.js 24.x                                |
| Setup Environment           | Configures pnpm and environment variables              |
| Download Docs Artifact      | Retrieves API docs from the CI job                     |
| Build Production            | Compiles all packages with production TypeScript config |
| Changesets                  | Creates a release PR or publishes to npm via [Changesets](https://github.com/changesets/changesets) |
| Deploy Documentation        | Publishes API docs to GitHub Pages                     |

### CodeQL Analysis

**Trigger:** Push to `main`, pull requests targeting `main`, weekly schedule (Thursdays)

Runs GitHub's [CodeQL](https://codeql.github.com/) static analysis for security vulnerability detection across JavaScript and Python files.

## Versioning

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

1. Create a changeset when making changes:
   ```shell
   pnpm changeset
   ```
2. Select the affected packages and the semver bump type
3. Commit the generated changeset file with your PR
4. When merged to `main`, the release workflow either:
   - Creates a **Version Packages** PR that bumps versions and updates changelogs
   - Or **publishes** the packages to npm if a version PR was already merged

## Documentation Deployment

API documentation is automatically generated and deployed to [GitHub Pages](https://gradientedge.github.io/cdk-utils/) on every successful push to `main`. The docs are built using [TypeDoc](https://typedoc.org/) during the CI job and deployed during the release job.

## Environment Variables

| Variable         | Source           | Description                    |
| ---------------- | ---------------- | ------------------------------ |
| `CODECOV_TOKEN`  | Repository secret | Token for Codecov uploads      |
| `GIT_TOKEN`      | Repository secret | GitHub token for release steps |
| `NPM_TOKEN`      | Repository secret | npm publish authentication     |
| `GITHUB_TOKEN`   | Auto-provided    | GitHub Actions built-in token  |
