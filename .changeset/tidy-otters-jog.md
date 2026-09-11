---
'@gradientedge/cdk-utils-azure': minor
'@gradientedge/cdk-utils': minor
---

Add `AzureEventHandler.eventGridDiagnosticSettings` prop. When set, the `AzureEventHandler` construct configures diagnostic logging for its EventGrid topic to Log Analytics, following the same opt-in pattern as the construct's existing Service Bus diagnostic settings.
