# Development

## Requirements

### Mandatory

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) 10
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html)

### Recommended

- [Visual Studio Code](https://code.visualstudio.com/)
  - [AWS Toolkit](https://marketplace.visualstudio.com/items?itemName=AmazonWebServices.aws-toolkit-vscode)
  - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
  - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [AWS Logs](https://github.com/jorgebastida/awslogs) — for tailing CloudWatch logs
- [Act](https://github.com/nektos/act) — for running GitHub Actions locally

### Docker System Requirements

| Resource | Value                                     |
| -------- | ----------------------------------------- |
| CPUs     | _1 (more performant if >2 available)_     |
| Memory   | _5 GB_                                    |
| Swap     | _1 GB_                                    |
| Disk     | _10 GB_                                   |

## Project Structure

```
cdk-utils/
├── packages/
│   ├── aws/              # AWS CDK constructs and service managers
│   ├── azure/            # Azure Pulumi constructs and service managers
│   ├── cloudflare/       # Cloudflare Pulumi constructs and service managers
│   ├── common/           # Shared utilities, types, and enums
│   └── cdk-utils/        # Umbrella package re-exporting all sub-packages
├── docs/                 # Project documentation (rendered in API docs)
├── img/                  # Architecture diagrams and logo
├── theme/                # Custom TypeDoc theme (CSS + JS)
├── .github/              # GitHub Actions workflows and actions
└── app/                  # Example applications
```

Each package under `packages/` follows a consistent structure:

```
packages/<name>/
├── src/
│   ├── common/           # Base constructs, stacks, and shared types
│   ├── construct/        # High-level construct patterns
│   ├── services/         # Service manager classes
│   └── index.ts          # Public API exports
├── test/                 # Unit and integration tests
├── package.json
└── tsconfig.json
```

## Setting up the Development Environment

### 1. Clone the repository

```shell
git clone https://github.com/gradientedge/cdk-utils.git
cd cdk-utils
```

### 2. Install dependencies

```shell
pnpm install
```

### 3. Build all packages

```shell
pnpm build
```

### 4. Run tests

```shell
pnpm test
```

## Common Tasks

### Install dependencies

```shell
pnpm install
```

### Build all packages

```shell
pnpm build
```

### Run the full validation suite (prettier + lint + test)

```shell
pnpm validate
```

### Run tests with watch mode

```shell
pnpm test:watch
```

### Lint and auto-fix

```shell
pnpm fix
```

### Format code with Prettier

```shell
pnpm prettify
```

### Generate API documentation

```shell
pnpm run docs
```

### Update dependencies

```shell
pnpm update:deps
```

### Build a specific package

```shell
pnpm --filter @gradientedge/cdk-utils-aws build
```

### Run tests for a specific package

```shell
pnpm --filter @gradientedge/cdk-utils-aws test
```

## Code Style

- **TypeScript** — strict mode enabled, `noImplicitAny`, `strictNullChecks`
- **Formatting** — [Prettier](https://prettier.io/) with organized imports
- **Linting** — [ESLint](https://eslint.org/) with TypeScript and JSDoc plugins
- **Module system** — ESM (`"type": "module"`) with Node.js module resolution

All code is automatically formatted and linted via pre-commit hooks (powered by [Husky](https://typicode.github.io/husky/)).

## Commit Conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>
```

Common types:

| Type       | Description                                |
| ---------- | ------------------------------------------ |
| `feat`     | A new feature                              |
| `fix`      | A bug fix                                  |
| `docs`     | Documentation changes                      |
| `style`    | Formatting, missing semicolons, etc.       |
| `refactor` | Code change that neither fixes nor adds    |
| `test`     | Adding or updating tests                   |
| `chore`    | Maintenance tasks (deps, CI, build, etc.)  |

Commit messages are validated automatically via a `commit-msg` hook using [commitlint](https://commitlint.js.org/).
