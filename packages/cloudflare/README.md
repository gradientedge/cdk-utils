# @gradientedge/cdk-utils-cloudflare

Cloudflare Pulumi utilities for provisioning and managing Cloudflare infrastructure using [Pulumi](https://www.pulumi.com/).

## Overview

This package provides high-level constructs and service managers for Cloudflare:

- **Constructs** — patterns for Worker Sites and Pages Static Sites
- **Services** — manager classes for Cloudflare services including Access, API Shield, Argo, DNS Records, Firewall, Filters, Pages, Rule Sets, Workers, and Zones
- **Common** — base constructs and stack classes

## Installation

```bash
pnpm add @gradientedge/cdk-utils-cloudflare
```

## Usage

```typescript
import { CommonCloudflareConstruct } from '@gradientedge/cdk-utils-cloudflare'

class MyCloudflareStack extends CommonCloudflareConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }
}
```
