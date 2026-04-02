# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) >= 22
- [pnpm](https://pnpm.io/) 10
- [AWS CLI](https://aws.amazon.com/cli/) (for AWS CDK deployments)
- An AWS account, Azure subscription, or Cloudflare account depending on your target platform

## Installation

Install the umbrella package which includes all sub-packages:

```bash
pnpm add @gradientedge/cdk-utils
```

Or install only the packages you need:

```bash
# AWS CDK utilities
pnpm add @gradientedge/cdk-utils-aws

# Azure Pulumi utilities
pnpm add @gradientedge/cdk-utils-azure

# Cloudflare Pulumi utilities
pnpm add @gradientedge/cdk-utils-cloudflare

# Common utilities (included as a dependency of the above)
pnpm add @gradientedge/cdk-utils-common
```

## Core Concepts

### Constructs

Constructs are high-level patterns that combine multiple AWS/Azure/Cloudflare resources into a single reusable unit. Examples include:

- **RestApiLambda** — API Gateway + Lambda function + IAM roles
- **ApiToEventBridgeTarget** — API Gateway + EventBridge integration
- **SiteWithLambdaBackend** — CloudFront + S3 + Lambda + Route53

### Service Managers

Service managers are injected into every construct and provide methods for creating individual resources. Each AWS/Azure/Cloudflare service has its own manager:

- `lambdaManager` — Lambda functions, layers, aliases
- `s3Manager` — S3 buckets, policies, notifications
- `dynamodbManager` — DynamoDB tables, indexes
- `ecsManager` — ECS clusters, services, task definitions
- And many more...

### Common Utilities

Shared across all packages:

- **Stage helpers** — `isDevStage()`, `isPrdStage()`, `isUatStage()`, `isTestStage()`
- **Stage enum** — `Stage.DEV`, `Stage.TEST`, `Stage.UAT`, `Stage.PROD`
- **Mixin support** — `applyMixins()` for composing multiple classes

## Quick Start — AWS

Create a custom construct by extending `CommonConstruct`:

```typescript
import { CommonConstruct, CommonStackProps } from '@gradientedge/cdk-utils-aws'
import { Construct } from 'constructs'

class MyInfrastructure extends CommonConstruct {
  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id, props)
    this.props = props
    this.initResources()
  }

  protected initResources() {
    // Create a Lambda function
    this.lambdaManager.createLambdaFunction('MyFunction', this, {
      name: 'my-function',
      handler: 'index.handler',
      runtime: 'nodejs22.x',
    })

    // Create an S3 bucket
    this.s3Manager.createBucket('MyBucket', this, {
      name: 'my-bucket',
      versioned: true,
    })

    // Create a DynamoDB table
    this.dynamodbManager.createTable('MyTable', this, {
      name: 'my-table',
      partitionKey: { name: 'id', type: 'S' },
    })
  }
}
```

Or use a pre-built construct pattern:

```typescript
import { RestApiLambda, RestApiLambdaProps } from '@gradientedge/cdk-utils-aws'
import { Construct } from 'constructs'

class MyApi extends RestApiLambda {
  constructor(parent: Construct, id: string, props: RestApiLambdaProps) {
    super(parent, id, props)
    this.props = props
    this.initResources()
  }
}
```

## Quick Start — Azure

The Azure package uses the [Pulumi Azure Native](https://www.pulumi.com/registry/packages/azure-native/) provider (`@pulumi/azure-native`), providing full coverage of the Azure Resource Manager API.

```typescript
import { CommonAzureConstruct } from '@gradientedge/cdk-utils-azure'
import * as pulumi from '@pulumi/pulumi'

class MyAzureInfra extends CommonAzureConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }

  protected initResources() {
    // Create a storage account
    this.storageManager.createStorageAccount('MyStorage', this, storageProps)

    // Create a function app
    this.functionManager.createFunctionApp('MyFunction', this, functionProps)

    // Create a CosmosDB database
    this.cosmosDbManager.createCosmosDbAccount('MyDb', this, cosmosProps)
  }
}
```

## Quick Start — Cloudflare

```typescript
import { CommonCloudflareConstruct } from '@gradientedge/cdk-utils-cloudflare'
import * as pulumi from '@pulumi/pulumi'

class MyCloudflareInfra extends CommonCloudflareConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }

  protected initResources() {
    // Manage a Cloudflare zone
    this.zoneManager.createZone('MyZone', this, zoneProps)

    // Deploy a Cloudflare Worker
    this.workerManager.createWorker('MyWorker', this, workerProps)

    // Configure DNS records
    this.recordManager.createRecord('MyRecord', this, recordProps)
  }
}
```

## Package Structure

| Package                              | Description                                         |
| ------------------------------------ | --------------------------------------------------- |
| `@gradientedge/cdk-utils-aws`       | AWS CDK constructs and service managers              |
| `@gradientedge/cdk-utils-azure`     | Azure Pulumi constructs and service managers          |
| `@gradientedge/cdk-utils-cloudflare` | Cloudflare Pulumi constructs and service managers    |
| `@gradientedge/cdk-utils-common`    | Shared utilities, types, and stage helpers            |
| `@gradientedge/cdk-utils`           | Umbrella package that re-exports all of the above     |

## Next Steps

- Browse the **Construct** categories in the sidebar for ready-to-use infrastructure patterns
- Browse the **Service** categories for individual service managers
- See the [Build](./Build.md) guide for build configuration details
- See the [Development](./Development.md) guide for setting up your development environment
- See the [CI/CD](./CI-CD.md) guide for understanding the automated pipeline
