---
'@gradientedge/cdk-utils-azure': patch
'@gradientedge/cdk-utils': patch
---

fix(event-handler): per-queue Service Bus authorization rule name now uses the literal `listen-send` instead of `${this.id}-listen-send`, avoiding Azure's 50-character `authorizationRuleName` cap on long stack ids. The rule is scoped to the queue (`…/queues/<queue>/authorizationRules/listen-send`) so a fixed name is unambiguous. Pulumi resource id is unchanged so state is stable.
