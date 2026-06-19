---
'@gradientedge/cdk-utils-aws': minor
'@gradientedge/cdk-utils': minor
---

Add `ProvisionedConcurrencyProps.onVersion` flag. When `true`, provisioned concurrency and its auto-scaling target attach to the published function version (`function:<fn>:<version>`) instead of the alias (`function:<fn>:<aliasName>`).

This avoids a deploy-wedging trap: when PC is on the alias, every CFN alias update that changes `FunctionVersion` triggers Lambda's built-in canary behaviour (CFN sets `RoutingConfig.AdditionalVersionWeights` to keep traffic on the old version until PC allocates on the new one). If the new version's init fails (`FUNCTION_ERROR_INIT_FAILURE`), the routing weights persist at 100% on old and every subsequent deploy fails with `Invalid alias configuration for Provisioned Concurrency`. With PC on the version instead, alias updates are atomic, no routing weights are ever set, and the wedge can't happen.

Default is `false`; existing consumers are unaffected. Trade-off: ApplicationAutoScaling targets accumulate one per deploy (resource id embeds the version) — fine for normal cadence; regional soft limit is 2,500.
