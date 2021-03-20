<div align="center">

  <a href="/docs/Architecture.md">![Architecture][docs-architecture]</a>
  <a href="/docs/Build.md">![Build Process][build-process]</a>
  <a href="/docs/Development.md">![Development][docs-development]</a>
  <a href="/docs/CI-CD.md">![CI-CD][docs-ci-cd]</a>

</div>

# Development

## Table of Contents
- [Requirements](#requirements)
- [Setting up Development Environment](#deployment-instructions)

## Requirements
### Mandatory
- [AWS CLI][aws-cli]
- [Node][node-cli]
- [Npm][npm-cli]
- [Yarn][yarn-cli]

### Optional
- [AWS Logs][aws-logs]
- [Grip][grip]
- [JetBrains IntelliJ Idea][intellij]
  - [AWS Toolkit][aws-toolkit]
  - [AWS CloudFormation][aws-cloudformation]
- [Act][act]
  
### Docker system Requirements
Resource | Value
-------- | -----
CPUs     | _1 (more performant if >2 available)_
Memory   | _5 GB_
Swap     | _1 GB_
Disk     | _10 GB_

## Development Instructions
### Install the packages
#### ![cmd]
With **npm**:
```shell
npm install
```

With **yarn**:
```shell
yarn install
```

### Build the packages
#### ![cmd]
With **npm**:
```shell
npm run build
```

With **yarn**:
```shell
yarn build
```

### Test the packages
#### ![cmd]
With **npm**:
```shell
npm run validate
```

With **yarn**:
```shell
yarn validate
```

<!-- references -->
[act]: https://github.com/nektos/act
[aws-cli]: https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-install.html
[aws-cloudformation]: https://plugins.jetbrains.com/plugin/7371-aws-cloudformation
[aws-logs]: https://github.com/jorgebastida/awslogs
[aws-toolkit]: https://plugins.jetbrains.com/plugin/11349-aws-toolkit
[bash-support]: https://plugins.jetbrains.com/plugin/4230-bashsupport
[build-process]: https://img.shields.io/badge/build--process-48DAD0?logo=read-the-docs&style=for-the-badge
[cmd]: https://img.shields.io/badge/command--line-4D4D4D?logo=windows-terminal&style=for-the-badge
[cyberduck]: https://cyberduck.io
[docs-development]: https://img.shields.io/badge/development-02303A?logo=read-the-docs&style=for-the-badge
[docs-ci-cd]: https://img.shields.io/badge/CI--CD-48DAD0?logo=read-the-docs&style=for-the-badge
[docker]: https://docs.docker.com/docker-for-mac/install
[docs-architecture]: https://img.shields.io/badge/architecture-48DAD0?logo=read-the-docs&style=for-the-badge
[grip]: https://github.com/joeyespo/grip
[intellij]: https://www.jetbrains.com/idea
[node-cli]: https://nodejs.org/
[npm-cli]: https://www.npmjs.com
[purescript]: https://img.shields.io/badge/package.json-4D4D4D?logo=purescript&style=for-the-badge
[yarn-cli]: https://yarnpkg.com
[package.json]: /package.json
