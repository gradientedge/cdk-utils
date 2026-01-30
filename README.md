# <img src="https://cdn.gradientedge.io/images/ge-logo-1200.png" width="175px" alt="Gradient Edge"> CDK Utils

[![Release][release]][release-url]
[![version][version]][version-url]

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

Toolkit for working with CDK Constructs ([AWS CDK][aws-cdk] & [Pulumi][pulumi]).

For more details, see the full [API documentation](https://gradientedge.github.io/cdk-utils/).

## Installation

### ![cmd]

With **npm**:

```shell
npm install --save @gradientedge/cdk-utils
```

With **pnpm**:

```shell
pnpm add @gradientedge/cdk-utils
```

### ![purescript]

```
"@gradientedge/cdk-utils": "latest"
```

## Testing

To run test cases, use the following command:

```shell
pnpm run test
```

To focus on the test and watch when you make changes, use the following command:

```shell
pnpm test:watch static-asset-deployment-distribution-ref.test.ts
```

### Toolkit

There are common utilities that help with testing constructs which you can find in the [test tools](./src/test/tools/cdk) directory.

### Debug

There is a debug utility that can be used to print out the contents of a `template`. This is useful for debugging and understanding the structure which you can find in the [debug](./src/test/tools/debug) directory.

<!-- references -->

[aws-cdk]: https://docs.aws.amazon.com/cdk/latest/guide/home.html
[aws-cli-badge]: https://img.shields.io/badge/aws--cli-2.3.4-777BB4?logo=amazon-aws
[aws-cli-url]: https://aws.amazon.com/cli/
[builds]: https://img.shields.io/github/actions/workflow/status/gradientedge/cdk-utils/ci.yml?branch=main
[builds-url]: https://github.com/gradientedge/cdk-utils/actions
[cdk-badge]: https://img.shields.io/github/package-json/dependency-version/gradientedge/cdk-utils/aws-cdk-lib
[pulumi]: https://www.pulumi.com/docs/
[cdk-url]: https://aws.amazon.com/cdk/
[checks]: https://img.shields.io/github/checks-status/gradientedge/cdk-utils/main
[cmd]: https://img.shields.io/badge/command--line-4D4D4D?logo=windows-terminal&style=for-the-badge
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
[pulumi-badge]: https://img.shields.io/github/package-json/dependency-version/gradientedge/cdk-utils/@pulumi/pulumi
[pulumi-azure-badge]: https://img.shields.io/github/package-json/dependency-version/gradientedge/cdk-utils/@pulumi/azure-native
[pulumi-cloudflare-badge]: https://img.shields.io/github/package-json/dependency-version/gradientedge/cdk-utils/@pulumi/cloudflare
[pulumi-url]: https://www.pulumi.com/
[pulumi-azure-url]: https://www.pulumi.com/registry/packages/azure-native/
[pulumi-cloudflare-url]: https://www.pulumi.com/registry/packages/cloudflare/
[last-commit]: https://img.shields.io/github/last-commit/gradientedge/cdk-utils
[license]: https://img.shields.io/github/license/gradientedge/cdk-utils
[license-url]: https://github.com/gradientedge/cdk-utils/blob/main/LICENSE
[logo]: https://cdn.gradientedge.io/images/ge-logo-1200.png
[maintained]: https://img.shields.io/badge/maintained-YES-green
[node-badge]: https://img.shields.io/node/v/@gradientedge/cdk-utils
[node-url]: https://nodejs.dev
[purescript]: https://img.shields.io/badge/package.json-4D4D4D?logo=purescript
[release]: https://img.shields.io/github/release/gradientedge/cdk-utils.svg
[release-url]: https://gradientedge.github.io/cdk-utils/
[repo-url]: https://github.com/gradientedge/cdk-utils
[twitter]: https://img.shields.io/twitter/follow/gradientedge
[twitter-url]: https://twitter.com/gradientedge
[version]: https://img.shields.io/npm/v/@gradientedge/cdk-utils
[version-url]: https://www.npmjs.com/package/@gradientedge/cdk-utils
