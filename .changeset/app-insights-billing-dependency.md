---
'@gradientedge/cdk-utils-azure': patch
---

Make Application Insights billing features depend on their parent component so fresh deployments no longer fail with `ParentResourceNotFound` when the billing features are written before the component exists.
