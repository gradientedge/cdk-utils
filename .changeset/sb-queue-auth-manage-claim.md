---
'@gradientedge/cdk-utils-azure': patch
'@gradientedge/cdk-utils': patch
---

Grant `Manage` on the per-queue `listen-send` authorization rule created by `AzureEventHandler`. The Functions scale controller calls the Service Bus management API to derive queue-length metrics, which requires `Manage`/`EntityRead`; without it the host logged a 401 on every invocation and fell back to first-message-enqueued-time based scaling. The rule name is unchanged so the rights update in place without rotating the SAS keys behind `EVENT_INGEST_SERVICE_BUS`.
