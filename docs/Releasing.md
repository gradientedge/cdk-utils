# Releasing

This project uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

## How Changesets Work

Changesets decouple "recording what changed" from "releasing the change":

1. **During development** — you create a changeset file describing what changed
2. **At release time** — changesets are consumed to bump versions, update changelogs, and publish

## Creating a Changeset

After making changes, create a changeset:

```shell
pnpm changeset
```

You'll be prompted to:

1. **Select affected packages** — choose which packages your change impacts
2. **Select bump type** — `patch`, `minor`, or `major` for each package
3. **Write a summary** — describe what changed (this becomes the changelog entry)

This creates a markdown file in `.changeset/`:

```
.changeset/
└── cool-dogs-dance.md
```

Example changeset file:

```yaml
---
"@gradientedge/cdk-utils-aws": minor
"@gradientedge/cdk-utils": minor
---

Added EKS Fargate profile support to EksManager
```

### When to Use Each Bump Type

| Type | When to Use |
|------|-------------|
| `patch` | Bug fixes, dependency updates, documentation changes |
| `minor` | New features, new service manager methods, new construct patterns |
| `major` | Breaking changes — removed methods, changed interfaces, renamed exports |

### Tips

- Create one changeset per logical change (not per commit)
- If a PR has multiple unrelated changes, create multiple changesets
- Commit the changeset file with your PR
- The umbrella package (`@gradientedge/cdk-utils`) should be bumped alongside the sub-package it re-exports

## The Release Flow

When changesets are merged to `main`, the CI pipeline handles everything:

```
PR with changeset merged to main
         │
         ▼
  ┌─────────────────────────┐
  │ CI detects changesets    │
  │ in .changeset/ directory │
  └─────────┬───────────────┘
            │
            ▼
  ┌─────────────────────────┐
  │ Creates "Version         │
  │ Packages" PR             │
  │ - Bumps package.json     │
  │ - Updates CHANGELOGs     │
  │ - Removes changeset files│
  └─────────┬───────────────┘
            │
     (when merged)
            │
            ▼
  ┌─────────────────────────┐
  │ Publishes to npm         │
  │ - pnpm release           │
  │ - changeset publish      │
  └─────────┬───────────────┘
            │
            ▼
  ┌─────────────────────────┐
  │ Deploys documentation    │
  │ to GitHub Pages          │
  └─────────────────────────┘
```

### Step by Step

1. **You merge a PR** with changeset files to `main`
2. **CI runs the Changesets action** which detects pending changesets
3. **A "Version Packages" PR is created** automatically:
   - `package.json` versions are bumped in affected packages
   - `CHANGELOG.md` files are updated with the changeset summaries
   - The changeset files in `.changeset/` are deleted
4. **You review and merge** the Version Packages PR
5. **CI detects no pending changesets** and runs `pnpm release` which calls `changeset publish`
6. **Packages are published** to npm with public access
7. **API documentation** is deployed to GitHub Pages

## Configuration

The changeset configuration lives in `.changeset/config.json`:

| Option | Value | Description |
|--------|-------|-------------|
| `changelog` | `@changesets/changelog-github` | Generates changelog entries with GitHub PR links |
| `commit` | `false` | Don't auto-commit version bumps |
| `access` | `public` | Publish packages with public access |
| `baseBranch` | `main` | Target branch for releases |
| `updateInternalDependencies` | `patch` | Bump internal workspace deps as patch |

## Manual Publishing

If you need to publish manually (e.g., CI failure):

```shell
# 1. Consume changesets and bump versions
pnpm changeset version

# 2. Review the changes
git diff

# 3. Commit the version bumps
git add .
git commit -m "chore: version packages"

# 4. Build for production
pnpm build:production

# 5. Publish to npm
pnpm release
```

## Pre-release Versions

For pre-release (beta/alpha) versions:

```shell
# Enter pre-release mode
pnpm changeset pre enter beta

# Create changesets as normal
pnpm changeset

# Version (creates beta versions like 1.1.0-beta.0)
pnpm changeset version

# Exit pre-release mode when ready
pnpm changeset pre exit
```

## Troubleshooting

### "No changesets found"

If the Version Packages PR isn't created, ensure:

- Changeset files exist in `.changeset/` (not just the `config.json`)
- Files are properly committed and pushed to `main`

### "Package not found on npm"

First-time publish for a new package requires:

- `"access": "public"` in the package's `publishConfig`
- npm authentication token in CI secrets (`NPM_TOKEN`)

### Version mismatch

If internal dependency versions are out of sync:

```shell
pnpm changeset version
```

This recalculates all versions based on pending changesets and the `updateInternalDependencies` config.
