# @gradientedge/cdk-utils-azure

Azure Pulumi utilities for provisioning and managing Azure infrastructure using [Pulumi](https://www.pulumi.com/) with the [Azure Native](https://www.pulumi.com/registry/packages/azure-native/) provider (`@pulumi/azure-native`).

## Overview

This package provides high-level constructs and service managers for Azure:

- **Constructs** — patterns for REST APIs, Function Apps, Event Handlers, and web apps
- **Services** — manager classes for Azure services including API Management, CosmosDB, DNS, EventGrid, Key Vault, Redis, Storage, and more
- **Common** — base constructs, stack classes, and resource name formatting utilities

## Installation

```bash
pnpm add @gradientedge/cdk-utils-azure
```

## Usage

```typescript
import { CommonAzureConstruct } from '@gradientedge/cdk-utils-azure'

class MyAzureStack extends CommonAzureConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }
}
```
