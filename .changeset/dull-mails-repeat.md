---
'@gradientedge/cdk-utils-azure': patch
---

Redeploy load test definitions when their configuration content changes

`AzureLoadTesting` triggered the deployment command on the config file name only, so test definitions and their uploaded scripts were never redeployed after the first apply. The deployment is now also triggered by a content hash of the test configuration directory.
