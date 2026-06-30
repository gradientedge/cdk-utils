# @gradientedge/cdk-utils-aws

## 2.23.0

### Minor Changes

- [#1115](https://github.com/gradientedge/cdk-utils/pull/1115) [`1d9d8f5`](https://github.com/gradientedge/cdk-utils/commit/1d9d8f58c53c22d62c288393d0e61385500be78a) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

## 2.22.0

### Minor Changes

- [#1110](https://github.com/gradientedge/cdk-utils/pull/1110) [`d650aa2`](https://github.com/gradientedge/cdk-utils/commit/d650aa2f0c65bf110888e1d6d8eb5444c488fb38) Thanks [@despock](https://github.com/despock)! - Add `ProvisionedConcurrencyProps.onVersion` flag. When `true`, provisioned concurrency and its auto-scaling target attach to the published function version (`function:<fn>:<version>`) instead of the alias (`function:<fn>:<aliasName>`).

  This avoids a deploy-wedging trap: when PC is on the alias, every CFN alias update that changes `FunctionVersion` triggers Lambda's built-in canary behaviour (CFN sets `RoutingConfig.AdditionalVersionWeights` to keep traffic on the old version until PC allocates on the new one). If the new version's init fails (`FUNCTION_ERROR_INIT_FAILURE`), the routing weights persist at 100% on old and every subsequent deploy fails with `Invalid alias configuration for Provisioned Concurrency`. With PC on the version instead, alias updates are atomic, no routing weights are ever set, and the wedge can't happen.

  Default is `false`; existing consumers are unaffected. Trade-off: ApplicationAutoScaling targets accumulate one per deploy (resource id embeds the version) — fine for normal cadence; regional soft limit is 2,500.

## 2.21.0

### Minor Changes

- [`9587062`](https://github.com/gradientedge/cdk-utils/commit/958706205176d6364faeac80cc745331018b251e) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

## 2.20.1

### Patch Changes

- [#1106](https://github.com/gradientedge/cdk-utils/pull/1106) [`593a13a`](https://github.com/gradientedge/cdk-utils/commit/593a13a331cc7bbb2496b69f81fe4b6cc4225143) Thanks [@despock](https://github.com/despock)! - fix: use lodash default import to fix ESM named-export crash

## 2.20.0

### Minor Changes

- [#1102](https://github.com/gradientedge/cdk-utils/pull/1102) [`4cb4eb5`](https://github.com/gradientedge/cdk-utils/commit/4cb4eb57f4cda05df4d1400899811ec7c0c7cb11) Thanks [@despock](https://github.com/despock)! - Expose created Lambda Aliases on the returned Function (new `FunctionWithAliases` type), and accept an `IBucket` for S3 server access logging (new optional `logBucket` on `S3BucketProps`).

  Both let downstream constructs work with the real L2 instances instead of re-importing by ARN/name — clearing the `UnclearLambdaEnvironment` warning (and silently-dropped `addPermission()` invokes) when wiring `LambdaIntegration` to an alias, and the `accessLogsPolicyNotAdded` warning when the caller owns the log destination bucket. `StaticSite` is updated to pass its just-created `siteLogBucket` through so consumers benefit without code changes.

## 2.19.0

### Minor Changes

- [#1099](https://github.com/gradientedge/cdk-utils/pull/1099) [`0ad896e`](https://github.com/gradientedge/cdk-utils/commit/0ad896e40d749eb53843917ff759ae9a63a739e7) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

## 2.18.0

### Minor Changes

- [`14c0479`](https://github.com/gradientedge/cdk-utils/commit/14c0479245c7c37d64b7ed10c3c3c4316b1e49c5) Thanks [@despock](https://github.com/despock)! - feat: general improvements

### Patch Changes

- Updated dependencies [[`14c0479`](https://github.com/gradientedge/cdk-utils/commit/14c0479245c7c37d64b7ed10c3c3c4316b1e49c5)]:
  - @gradientedge/cdk-utils-common@2.11.0

## 2.17.0

### Minor Changes

- [#1089](https://github.com/gradientedge/cdk-utils/pull/1089) [`f04944e`](https://github.com/gradientedge/cdk-utils/commit/f04944e5c3c02d37d7fdf134eabf137dd107deaa) Thanks [@despock](https://github.com/despock)! - feat: making domainName optional for Azure

### Patch Changes

- Updated dependencies [[`f04944e`](https://github.com/gradientedge/cdk-utils/commit/f04944e5c3c02d37d7fdf134eabf137dd107deaa)]:
  - @gradientedge/cdk-utils-common@2.10.0

## 2.16.0

### Minor Changes

- [#1087](https://github.com/gradientedge/cdk-utils/pull/1087) [`55c8683`](https://github.com/gradientedge/cdk-utils/commit/55c8683e29513e6dbcb47be8b0d89831ded2f578) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

## 2.15.0

### Minor Changes

- [`36af4ce`](https://github.com/gradientedge/cdk-utils/commit/36af4ce7a11374ea096bf77d1153c909298c18b8) Thanks [@despock](https://github.com/despock)! - feat: bumping versions

## 2.14.0

### Minor Changes

- [#1070](https://github.com/gradientedge/cdk-utils/pull/1070) [`1671d18`](https://github.com/gradientedge/cdk-utils/commit/1671d1873f14d494864bfcf90a122242e9b65ef0) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

### Patch Changes

- Updated dependencies [[`1671d18`](https://github.com/gradientedge/cdk-utils/commit/1671d1873f14d494864bfcf90a122242e9b65ef0)]:
  - @gradientedge/cdk-utils-common@2.9.0

## 2.13.0

### Minor Changes

- [`da5faec`](https://github.com/gradientedge/cdk-utils/commit/da5faec4f832daa7c0348d23acb6182bd35a6e7d) Thanks [@despock](https://github.com/despock)! - feat: removing pnpm catalog

- [#1067](https://github.com/gradientedge/cdk-utils/pull/1067) [`b09141a`](https://github.com/gradientedge/cdk-utils/commit/b09141a28629461f43c282cb678fa7d7e3420d0f) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

### Patch Changes

- Updated dependencies [[`da5faec`](https://github.com/gradientedge/cdk-utils/commit/da5faec4f832daa7c0348d23acb6182bd35a6e7d)]:
  - @gradientedge/cdk-utils-common@2.8.0

## 2.12.0

### Minor Changes

- [#1065](https://github.com/gradientedge/cdk-utils/pull/1065) [`27998eb`](https://github.com/gradientedge/cdk-utils/commit/27998ebc44b508cc1476d8ee11d4dc0285d48203) Thanks [@despock](https://github.com/despock)! - feat: bumping versions

### Patch Changes

- Updated dependencies [[`27998eb`](https://github.com/gradientedge/cdk-utils/commit/27998ebc44b508cc1476d8ee11d4dc0285d48203)]:
  - @gradientedge/cdk-utils-common@2.7.0

## 2.11.0

### Minor Changes

- [#1063](https://github.com/gradientedge/cdk-utils/pull/1063) [`5579912`](https://github.com/gradientedge/cdk-utils/commit/55799123bb1af682b7c0f0e299878bc4bc5973b5) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

### Patch Changes

- Updated dependencies [[`5579912`](https://github.com/gradientedge/cdk-utils/commit/55799123bb1af682b7c0f0e299878bc4bc5973b5)]:
  - @gradientedge/cdk-utils-common@2.6.0

## 2.10.0

### Minor Changes

- [`631fe12`](https://github.com/gradientedge/cdk-utils/commit/631fe1232e278c045cbdfb634a7eed35d938ed73) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

### Patch Changes

- Updated dependencies [[`631fe12`](https://github.com/gradientedge/cdk-utils/commit/631fe1232e278c045cbdfb634a7eed35d938ed73)]:
  - @gradientedge/cdk-utils-common@2.5.0

## 2.9.1

### Patch Changes

- [#1051](https://github.com/gradientedge/cdk-utils/pull/1051) [`da769dd`](https://github.com/gradientedge/cdk-utils/commit/da769dd4b319b7294a0b9ab9160e7887e26d0674) Thanks [@despock](https://github.com/despock)! - fix: using valid location instead of invalid location name in function dashboard

## 2.9.0

### Minor Changes

- [#1046](https://github.com/gradientedge/cdk-utils/pull/1046) [`098f3cc`](https://github.com/gradientedge/cdk-utils/commit/098f3ccd9e34c8cce530c0dc60390d8756b151aa) Thanks [@despock](https://github.com/despock)! - feat: add support for deep merging config

## 2.8.0

### Minor Changes

- [#1044](https://github.com/gradientedge/cdk-utils/pull/1044) [`9595484`](https://github.com/gradientedge/cdk-utils/commit/95954849ca553a92c01c8f2bc61900fd301639ad) Thanks [@despock](https://github.com/despock)! - feat: feat: add region and stage-region configuration layers for AWS and Azure

### Patch Changes

- Updated dependencies [[`9595484`](https://github.com/gradientedge/cdk-utils/commit/95954849ca553a92c01c8f2bc61900fd301639ad)]:
  - @gradientedge/cdk-utils-common@2.4.0

## 2.7.0

### Minor Changes

- [#1042](https://github.com/gradientedge/cdk-utils/pull/1042) [`8431596`](https://github.com/gradientedge/cdk-utils/commit/84315966b92664c015c61b5e02a9ca496467b5c7) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

## 2.6.0

### Minor Changes

- [`fd89e65`](https://github.com/gradientedge/cdk-utils/commit/fd89e65a03d1d1472cbbdb112a869d21a6d5b996) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

### Patch Changes

- Updated dependencies [[`fd89e65`](https://github.com/gradientedge/cdk-utils/commit/fd89e65a03d1d1472cbbdb112a869d21a6d5b996)]:
  - @gradientedge/cdk-utils-common@2.3.0

## 2.5.0

### Minor Changes

- [`7b33922`](https://github.com/gradientedge/cdk-utils/commit/7b339227602f41cd2358ee52b2296e110cca8300) Thanks [@despock](https://github.com/despock)! - feat: adding support for Application Insights Workbook

## 2.4.1

### Patch Changes

- [`9b66242`](https://github.com/gradientedge/cdk-utils/commit/9b66242df61db053c0b52f71bd50982dd1c60cb3) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

- Updated dependencies [[`9b66242`](https://github.com/gradientedge/cdk-utils/commit/9b66242df61db053c0b52f71bd50982dd1c60cb3)]:
  - @gradientedge/cdk-utils-common@2.2.1

## 2.4.0

### Minor Changes

- [`e98f1b8`](https://github.com/gradientedge/cdk-utils/commit/e98f1b8fdb8aaa565ecf8c7bcd6c73d4729d3c5f) Thanks [@despock](https://github.com/despock)! - docs: adding JSDocs

- [`83535fb`](https://github.com/gradientedge/cdk-utils/commit/83535fb00a1e64e94cbf2a8bdfaf13354c9de306) Thanks [@despock](https://github.com/despock)! - feat: bumping versions

### Patch Changes

- Updated dependencies [[`e98f1b8`](https://github.com/gradientedge/cdk-utils/commit/e98f1b8fdb8aaa565ecf8c7bcd6c73d4729d3c5f)]:
  - @gradientedge/cdk-utils-common@2.2.0

## 2.3.0

### Minor Changes

- [`6e84d65`](https://github.com/gradientedge/cdk-utils/commit/6e84d6513f3d6b797ca09ead6b54c587fbbf533d) Thanks [@despock](https://github.com/despock)! - feat: added support multiple stack resolution and skipping blob formatting

## 2.2.0

### Minor Changes

- [#1019](https://github.com/gradientedge/cdk-utils/pull/1019) [`d732bf2`](https://github.com/gradientedge/cdk-utils/commit/d732bf2e079191d13b1edf7207eaf9fc7508865c) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

## 2.1.0

### Minor Changes

- [#980](https://github.com/gradientedge/cdk-utils/pull/980) [`fc3cb9d`](https://github.com/gradientedge/cdk-utils/commit/fc3cb9d17244494e407c5c3313b5bdd966683bd1) Thanks [@despock](https://github.com/despock)! - bumping dependencies

### Patch Changes

- Updated dependencies [[`fc3cb9d`](https://github.com/gradientedge/cdk-utils/commit/fc3cb9d17244494e407c5c3313b5bdd966683bd1)]:
  - @gradientedge/cdk-utils-common@2.1.0

## 2.0.0

### Major Changes

- [`ec83082`](https://github.com/gradientedge/cdk-utils/commit/ec8308216d364948d822c1441cd215d8412c25c8) Thanks [@despock](https://github.com/despock)! - feat: testing root package bump

### Patch Changes

- Updated dependencies [[`ec83082`](https://github.com/gradientedge/cdk-utils/commit/ec8308216d364948d822c1441cd215d8412c25c8)]:
  - @gradientedge/cdk-utils-common@2.0.0

## 1.0.1

### Patch Changes

- [#971](https://github.com/gradientedge/cdk-utils/pull/971) [`b100aa7`](https://github.com/gradientedge/cdk-utils/commit/b100aa7f6a06985dba9d184e8c8f21b2db136745) Thanks [@despock](https://github.com/despock)! - feat: bumping dependencies

- Updated dependencies [[`b100aa7`](https://github.com/gradientedge/cdk-utils/commit/b100aa7f6a06985dba9d184e8c8f21b2db136745)]:
  - @gradientedge/cdk-utils-common@1.0.1
