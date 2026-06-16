---
'@gradientedge/cdk-utils-aws': minor
'@gradientedge/cdk-utils': minor
---

Expose created Lambda Aliases on the returned Function (new `FunctionWithAliases` type), and accept an `IBucket` for S3 server access logging (new optional `logBucket` on `S3BucketProps`).

Both let downstream constructs work with the real L2 instances instead of re-importing by ARN/name — clearing the `UnclearLambdaEnvironment` warning (and silently-dropped `addPermission()` invokes) when wiring `LambdaIntegration` to an alias, and the `accessLogsPolicyNotAdded` warning when the caller owns the log destination bucket. `StaticSite` is updated to pass its just-created `siteLogBucket` through so consumers benefit without code changes.
