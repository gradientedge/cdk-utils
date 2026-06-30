# <img src="https://cdn.gradientedge.io/images/ge-logo-1200.png" width="175px" alt="Gradient Edge"> CDK Utils

[![version][version]][version-url]
[![version-aws][version-aws]][version-aws-url]
[![version-azure][version-azure]][version-azure-url]
[![version-cloudflare][version-cloudflare]][version-cloudflare-url]
[![version-common][version-common]][version-common-url]

[![License][license]][license-url]
[![Maintained][maintained]][repo-url]
[![Dependencies][dependencies]][dependencies-url]
[![Twitter][twitter]][twitter-url]

[![AWS CLI][aws-cli-badge]][aws-cli-url]
[![Node][node-badge]][node-url]
[![CDK][cdk-badge]][cdk-url]
[![Pulumi][pulumi-badge]][pulumi-url]
[![Pulumi Azure][pulumi-azure-badge]][pulumi-azure-url]
[![Pulumi Cloudflare][pulumi-cloudflare-badge]][pulumi-cloudflare-url]

[![Builds][builds]][builds-url]
[![Coverage][coverage]][codecov-url]
[![Code Size][code-size]][version-url]

[![Downloads][downloads]][version-url]
[![Commits][commits]][commits-url]
[![Last Commits][last-commit]][commits-url]
[![Issues][issues]][issues-url]
[![Pull Requests][pr]][pr-url]

## Introduction

A comprehensive toolkit for provisioning cloud infrastructure using [AWS CDK][aws-cdk] and [Pulumi][pulumi]. This monorepo provides high-level constructs, service managers, and common utilities that simplify infrastructure-as-code across AWS, Azure, and Cloudflare.

For more details, see the full [API documentation](https://gradientedge.github.io/cdk-utils/).

## Packages

| Package                              | Description                                                 | Version                                                             |
| ------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `@gradientedge/cdk-utils-aws`        | AWS CDK constructs and service managers                     | [![version-aws][version-aws]][version-aws-url]                      |
| `@gradientedge/cdk-utils-azure`      | Azure Pulumi (Azure Native) constructs and service managers | [![version-azure][version-azure]][version-azure-url]                |
| `@gradientedge/cdk-utils-cloudflare` | Cloudflare Pulumi constructs and service managers           | [![version-cloudflare][version-cloudflare]][version-cloudflare-url] |
| `@gradientedge/cdk-utils-common`     | Shared utilities, types, and stage helpers                  | [![version-common][version-common]][version-common-url]             |
| `@gradientedge/cdk-utils`            | Umbrella package that re-exports all of the above           | [![version][version]][version-url]                                  |

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) 10

## Installation

Install the umbrella package:

```shell
pnpm add @gradientedge/cdk-utils
```

Or install individual packages as needed:

```shell
pnpm add @gradientedge/cdk-utils-aws
pnpm add @gradientedge/cdk-utils-azure
pnpm add @gradientedge/cdk-utils-cloudflare
pnpm add @gradientedge/cdk-utils-common
```

## Quick Start

### AWS

```typescript
import { CommonConstruct, CommonStackProps } from '@gradientedge/cdk-utils-aws'
import { Construct } from 'constructs'

class MyStack extends CommonConstruct {
  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id, props)
    this.initResources()
  }

  protected initResources() {
    this.lambdaManager.createLambdaFunction('MyFunction', this, functionProps)
    this.s3Manager.createBucket('MyBucket', this, bucketProps)
  }
}
```

### Azure

```typescript
import { CommonAzureConstruct } from '@gradientedge/cdk-utils-azure'
import * as pulumi from '@pulumi/pulumi'

class MyAzureStack extends CommonAzureConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }
}
```

### Cloudflare

```typescript
import { CommonCloudflareConstruct } from '@gradientedge/cdk-utils-cloudflare'
import * as pulumi from '@pulumi/pulumi'

class MyCloudflareStack extends CommonCloudflareConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }
}
```

## Development

### Setup

```shell
pnpm install
pnpm build
```

### Testing

Run the full test suite:

```shell
pnpm test
```

Watch mode for a specific test:

```shell
pnpm test:watch static-asset-deployment-distribution-ref.test.ts
```

### Validation

Run prettier, linting, and tests:

```shell
pnpm validate
```

### Generate API Documentation

```shell
pnpm run docs
```

### Test Utilities

There are common utilities that help with testing constructs in the [test tools](https://github.com/gradientedge/cdk-utils/tree/main/packages/aws/test/tools/cdk) directory. A [debug](https://github.com/gradientedge/cdk-utils/tree/main/packages/aws/test/tools/debug) utility is also available for printing template contents during development.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

<!-- references -->

[aws-cdk]: https://docs.aws.amazon.com/cdk/latest/guide/home.html
[aws-cli-badge]: https://img.shields.io/badge/aws--cli-2.3.4-777BB4?logo=amazon-aws
[aws-cli-url]: https://aws.amazon.com/cli/
[builds]: https://img.shields.io/github/actions/workflow/status/gradientedge/cdk-utils/ci.yml?branch=main
[builds-url]: https://github.com/gradientedge/cdk-utils/actions
[cdk-badge]: https://img.shields.io/github/package-json/dependency-version/gradientedge/cdk-utils/aws-cdk-lib?filename=packages/aws/package.json
[pulumi]: https://www.pulumi.com/docs/
[cdk-url]: https://aws.amazon.com/cdk/
[code-size]: https://img.shields.io/github/languages/code-size/gradientedge/cdk-utils
[codecov-url]: https://app.codecov.io/gh/gradientedge/cdk-utils
[coverage]: https://codecov.io/gh/gradientedge/cdk-utils/branch/main/graph/badge.svg
[commits]: https://img.shields.io/github/commit-activity/m/gradientedge/cdk-utils
[commits-url]: https://github.com/gradientedge/cdk-utils/commits/main
[downloads]: https://img.shields.io/npm/dw/@gradientedge/cdk-utils
[dependencies]: https://img.shields.io/librariesio/release/npm/@gradientedge/cdk-utils
[dependencies-url]: https://github.com/gradientedge/cdk-utils/blob/main/package.json
[issues]: https://img.shields.io/github/issues/gradientedge/cdk-utils.svg
[issues-url]: https://github.com/gradientedge/cdk-utils/issues
[pr]: https://img.shields.io/github/issues-pr/gradientedge/cdk-utils.svg
[pr-url]: https://github.com/gradientedge/cdk-utils/pulls
[pulumi-badge]: https://img.shields.io/badge/dynamic/yaml?url=https://raw.githubusercontent.com/gradientedge/cdk-utils/main/pnpm-workspace.yaml&query=$.catalog['@pulumi/pulumi']&label=@pulumi/pulumi&color=blueviolet
[pulumi-azure-badge]: https://img.shields.io/badge/dynamic/yaml?url=https://raw.githubusercontent.com/gradientedge/cdk-utils/main/pnpm-workspace.yaml&query=$.catalog['@pulumi/azure-native']&label=@pulumi/azure-native&color=blueviolet
[pulumi-cloudflare-badge]: https://img.shields.io/github/package-json/dependency-version/gradientedge/cdk-utils/@pulumi/cloudflare?filename=packages/cloudflare/package.json
[pulumi-url]: https://www.pulumi.com/
[pulumi-azure-url]: https://www.pulumi.com/registry/packages/azure-native/
[pulumi-cloudflare-url]: https://www.pulumi.com/registry/packages/cloudflare/
[last-commit]: https://img.shields.io/github/last-commit/gradientedge/cdk-utils
[license]: https://img.shields.io/github/license/gradientedge/cdk-utils
[license-url]: https://github.com/gradientedge/cdk-utils/blob/main/LICENSE
[maintained]: https://img.shields.io/badge/maintained-YES-green
[node-badge]: https://img.shields.io/node/v/@gradientedge/cdk-utils
[node-url]: https://nodejs.org/
[release]: https://img.shields.io/github/release/gradientedge/cdk-utils.svg
[release-url]: https://gradientedge.github.io/cdk-utils/
[repo-url]: https://github.com/gradientedge/cdk-utils
[twitter]: https://img.shields.io/twitter/follow/gradientedge
[twitter-url]: https://twitter.com/gradientedge
[version]: https://img.shields.io/npm/v/@gradientedge/cdk-utils?label=cdk-utils
[version-url]: https://www.npmjs.com/package/@gradientedge/cdk-utils
[version-aws]: https://img.shields.io/npm/v/@gradientedge/cdk-utils-aws?label=cdk-utils-aws
[version-aws-url]: https://www.npmjs.com/package/@gradientedge/cdk-utils-aws
[version-azure]: https://img.shields.io/npm/v/@gradientedge/cdk-utils-azure?label=cdk-utils-azure
[version-azure-url]: https://www.npmjs.com/package/@gradientedge/cdk-utils-azure
[version-cloudflare]: https://img.shields.io/npm/v/@gradientedge/cdk-utils-cloudflare?label=cdk-utils-cloudflare
[version-cloudflare-url]: https://www.npmjs.com/package/@gradientedge/cdk-utils-cloudflare
[version-common]: https://img.shields.io/npm/v/@gradientedge/cdk-utils-common?label=cdk-utils-common
[version-common-url]: https://www.npmjs.com/package/@gradientedge/cdk-utils-common
