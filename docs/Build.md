# Build

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) 10

## Build Commands

### Build all packages

Compiles TypeScript source in every package:

```shell
pnpm build
```

This runs `tsc` in each package via pnpm's recursive build, producing JavaScript output in `dist/` directories.

### Production build

Uses production-specific TypeScript configurations (`tsconfig.prd.json`) which may exclude test files and enable additional optimizations:

```shell
pnpm build:production
```

### Build a specific package

```shell
pnpm --filter @gradientedge/cdk-utils-aws build
pnpm --filter @gradientedge/cdk-utils-azure build
pnpm --filter @gradientedge/cdk-utils-cloudflare build
pnpm --filter @gradientedge/cdk-utils-common build
```

## CI Build

The full CI pipeline runs install, build, validation, and documentation generation:

```shell
pnpm run ci
```

This executes the following steps in order:

| Step                           | Command                          | Description                        |
| ------------------------------ | -------------------------------- | ---------------------------------- |
| Install                        | `pnpm install --frozen-lockfile` | Install dependencies (exact versions) |
| Build                          | `pnpm build`                     | Compile all packages               |
| Validate                       | `pnpm validate`                  | Run prettier, lint, and tests      |
| Generate Docs                  | `pnpm run docs`                  | Generate API documentation         |

## Build Output

Each package produces its build output in a `dist/` directory:

```
packages/<name>/dist/
├── src/
│   ├── index.js          # Compiled entry point
│   ├── index.d.ts        # Type declarations
│   ├── index.d.ts.map    # Declaration source maps
│   └── ...               # Compiled source files
```

Only the `dist/src/` directory is included in published npm packages (configured via `"files"` in each `package.json`).

## TypeScript Configuration

The project uses a shared base TypeScript configuration:

- **`tsconfig.base.json`** — shared compiler options (strict mode, ESM, Node.js module resolution)
- **`packages/<name>/tsconfig.json`** — extends the base, includes `src/` and `test/` files
- **`packages/<name>/tsconfig.prd.json`** — production config, typically excludes test files

Key compiler options:

| Option                       | Value       | Description                          |
| ---------------------------- | ----------- | ------------------------------------ |
| `target`                     | `esnext`    | Latest ECMAScript features           |
| `module`                     | `nodenext`  | Node.js ESM module system            |
| `strict`                     | `true`      | All strict type-checking options     |
| `declaration`                | `true`      | Emit `.d.ts` type declaration files  |
| `declarationMap`             | `true`      | Emit `.d.ts.map` for IDE navigation  |
| `sourceMap`                  | `true`      | Emit source maps for debugging       |
| `skipLibCheck`               | `true`      | Skip type checking of `.d.ts` files  |
