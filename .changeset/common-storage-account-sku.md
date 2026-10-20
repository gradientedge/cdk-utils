---
'@gradientedge/cdk-utils-azure': patch
---

Use `commonStorageAccountSku` as the default SKU for Azure storage accounts when an account-specific SKU is not provided. Preserve the existing `Standard_LRS` fallback when neither is configured.
