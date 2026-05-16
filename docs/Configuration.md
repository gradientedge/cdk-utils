# Configuration

This guide explains how to configure CDK Utils for different environments and deployment stages.

## CommonStackProps

The primary configuration interface. All properties are passed through the CDK context.

### Core Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Stack/construct identifier |
| `stage` | `string` | Yes | Deployment stage (e.g., `dev`, `tst`, `uat`, `prd`) |
| `region` | `string` | Yes | AWS region for deployment |
| `domainName` | `string` | Yes | Base domain name (e.g., `example.com`) |
| `subDomain` | `string` | No | Subdomain prefix (e.g., `api`) |
| `stackName` | `string` | No | Override the CloudFormation stack name |
| `extraContexts` | `string[]` | No | Paths to additional context JSON files |
| `regionContexts` | `string[]` | No | Paths to region-specific context JSON files (AWS and Azure only) |
| `stageContextPath` | `string` | No | Directory containing stage context files (default: `cdk-env` for AWS, `pulumi-env` for Azure) |

### Resource Naming Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `globalPrefix` | `string` | — | Prefix applied to all resource names |
| `globalSuffix` | `string` | — | Suffix applied to all resource names |
| `resourcePrefix` | `string` | — | Project-level prefix for resource names |
| `resourceSuffix` | `string` | — | Project-level suffix for resource names |
| `resourceProjectIdentifier` | `string` | — | Project identifier for cross-project references |
| `resourceNameOptions` | `object` | — | Per-resource naming overrides (see below) |

### Runtime Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `nodejsRuntime` | `Runtime` | `NODEJS_24_X` | Lambda Node.js runtime version |
| `logRetention` | `RetentionDays` | — | CloudWatch log retention period |
| `defaultReservedLambdaConcurrentExecutions` | `number` | — | Default reserved concurrency for Lambda |
| `defaultTracing` | `Tracing` | — | Default X-Ray tracing mode for Lambda |

### Bucket Naming Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `excludeDomainNameForBuckets` | `boolean` | `false` | Exclude domain name from S3 bucket names |
| `excludeAccountNumberForBuckets` | `boolean` | `false` | Exclude AWS account number from bucket names |

### Domain Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `skipStageForARecords` | `boolean` | `false` | Skip stage prefix in Route53 A records (useful for production) |

## Stage Configuration

### Directory Structure

Create a `cdk-env/` directory in your project root with a JSON file per stage:

```
my-project/
├── cdk.json
├── cdk-env/
│   ├── dev.json
│   ├── tst.json
│   ├── uat.json
│   └── prd.json
```

### Stage File Example

`cdk-env/tst.json`:

```json
{
  "stage": "tst",
  "subDomain": "test",
  "resourcePrefix": "myapp",
  "apiSubDomain": "api",
  "siteSubDomain": "site",
  "logLevel": "debug",
  "nodeEnv": "development",
  "timezone": "UTC",
  "useExistingHostedZone": true
}
```

### How Stage Loading Works

1. CDK reads the `stage` value from context (typically passed via `-c stage=tst`)
2. `CommonStack` looks for `cdk-env/{stage}.json`
3. Properties from the stage file are merged into the CDK context
4. Objects and arrays are deep-merged; primitives are overwritten
5. Stage context has the highest priority in the configuration hierarchy — it overrides both extra and region contexts

### Custom Stage Context Path

Override the default `cdk-env/` directory:

```json
// cdk.json
{
  "context": {
    "stageContextPath": "cdk-environments"
  }
}
```

## Configuration Hierarchy

Configuration is loaded in layers, where each layer overrides the previous:

```
1. Base props (lowest priority)
2. Extra contexts
3. Region contexts
4. Stage contexts (highest priority)
```

This means:

- **Stage contexts** always win for any property they set
- **Region contexts** override extra contexts, but are overridden by stage contexts
- **Extra contexts** provide shared defaults, overridden by both region and stage
- **Base props** (passed directly to the stack constructor) have the lowest priority

## Extra Contexts

Layer additional configuration files for shared settings:

```json
// cdk.json
{
  "context": {
    "extraContexts": [
      "cdk-config/shared.json",
      "cdk-config/secrets.json"
    ]
  }
}
```

Extra contexts are loaded first. Region and stage contexts take precedence over extra contexts for any overlapping properties.

## Region Contexts

Layer region-specific configuration between extra contexts and stage contexts. This is useful for multi-region deployments where resources need different configuration per region (e.g., resource prefixes, location settings, SKU availability).

Region contexts are supported in **AWS** and **Azure** stacks. Cloudflare does not have a region concept and does not support region contexts.

### AWS (cdk.json)

```json
{
  "context": {
    "extraContexts": ["cdk-config/shared.json"],
    "regionContexts": [
      "cdk-region/eu-west-1.json"
    ],
    "stageContextPath": "cdk-env",
    "stage": "dev"
  }
}
```

### Azure (Pulumi.yaml)

```yaml
name: my-azure-project
runtime: nodejs
config:
  extraContexts:
    - pulumi-config/shared.json
  regionContexts:
    - pulumi-region/uksouth.json
  stageContextPath: pulumi-env
  stage: dev
```

### Example: AWS — Base Config with Region Override

`cdk-config/shared.json` — base config defines a Lambda with modest defaults:

```json
{
  "graphqlApi": {
    "functionName": "graphql-server",
    "memorySize": 512,
    "timeoutInSecs": 60,
    "logRetentionInDays": 7
  },
  "siteBucket": {
    "bucketName": "site",
    "logBucketName": "site-logs"
  }
}
```

`cdk-region/eu-west-1.json` — EU region overrides with higher memory and longer retention:

```json
{
  "region": "eu-west-1",
  "resourcePrefix": "ge-eu-west-1",
  "subDomain": "eu",
  "apiSubDomain": "api-eu",
  "graphqlApi": {
    "functionName": "graphql-server",
    "memorySize": 1024,
    "timeoutInSecs": 300,
    "logRetentionInDays": 30
  },
  "siteBucket": {
    "bucketName": "site-eu",
    "logBucketName": "site-logs-eu"
  }
}
```

`cdk-region/us-east-1.json` — US primary region overrides with even higher memory and longer retention:

```json
{
  "region": "us-east-1",
  "resourcePrefix": "ge-us-east-1",
  "subDomain": "us",
  "apiSubDomain": "api-us",
  "graphqlApi": {
    "functionName": "graphql-server",
    "memorySize": 2048,
    "timeoutInSecs": 300,
    "logRetentionInDays": 90
  },
  "siteBucket": {
    "bucketName": "site-us",
    "logBucketName": "site-logs-us"
  }
}
```

### Example: Azure — Base Config with Region Override

`pulumi-config/shared.json` — base config defines a Function App with a Basic SKU:

```json
{
  "functionApp": {
    "name": "api-function-app",
    "resourceGroupName": "rg-shared",
    "kind": "functionapp",
    "sku": {
      "name": "B1",
      "tier": "Basic"
    }
  }
}
```

`pulumi-region/uksouth.json` — UK South overrides with Elastic Premium for production-grade workloads:

```json
{
  "location": "uksouth",
  "resourcePrefix": "ge-uksouth",
  "subDomain": "uk",
  "locationConfig": {
    "uksouth": {
      "id": "uksouth",
      "name": "UK South"
    }
  },
  "functionApp": {
    "name": "api-function-app",
    "resourceGroupName": "rg-uksouth",
    "kind": "functionapp",
    "sku": {
      "name": "EP1",
      "tier": "ElasticPremium"
    }
  }
}
```

`pulumi-region/westeurope.json` — West Europe overrides with a higher Elastic Premium tier for the primary region:

```json
{
  "location": "westeurope",
  "resourcePrefix": "ge-westeurope",
  "subDomain": "eu",
  "locationConfig": {
    "westeurope": {
      "id": "westeurope",
      "name": "West Europe"
    }
  },
  "functionApp": {
    "name": "api-function-app",
    "resourceGroupName": "rg-westeurope",
    "kind": "functionapp",
    "sku": {
      "name": "EP2",
      "tier": "ElasticPremium"
    }
  }
}
```

### Directory Structure

Following the existing conventions for test and config directories:

```
my-aws-project/
├── cdk.json
├── cdk-config/          # Extra contexts (shared config)
│   └── shared.json
├── cdk-region/          # Region contexts
│   ├── eu-west-1.json
│   └── us-east-1.json
└── cdk-env/             # Stage contexts
    ├── dev.json
    ├── tst.json
    └── prd.json

my-azure-project/
├── Pulumi.yaml
├── pulumi-config/      # Extra contexts (shared config)
│   └── shared.json
├── pulumi-region/      # Region contexts
│   ├── uksouth.json
│   └── westeurope.json
└── pulumi-env/         # Stage contexts
    ├── dev.json
    ├── tst.json
    └── prd.json
```

### How Region Context Overrides Work

**Azure** — base defines a Basic SKU, region promotes to Elastic Premium, stage overrides the subdomain:

| Property | Base (`shared.json`) | Region (`uksouth.json`) | Stage (`dev.json`) | Result |
|----------|---------------------|------------------------|-------------------|--------|
| `functionApp.sku.name` | `B1` | `EP1` | — | `EP1` (region wins) |
| `functionApp.sku.tier` | `Basic` | `ElasticPremium` | — | `ElasticPremium` (region wins) |
| `functionApp.resourceGroupName` | `rg-shared` | `rg-uksouth` | — | `rg-uksouth` (region wins) |
| `location` | — | `uksouth` | — | `uksouth` (region only) |
| `subDomain` | — | `uk` | `dev` | `dev` (stage wins) |

**AWS** — base defines a 512 MB Lambda, region scales up to 1024 MB, stage overrides the prefix:

| Property | Base (`shared.json`) | Region (`eu-west-1.json`) | Stage (`dev.json`) | Result |
|----------|---------------------|--------------------------|-------------------|--------|
| `graphqlApi.memorySize` | `512` | `1024` | — | `1024` (region wins) |
| `graphqlApi.timeoutInSecs` | `60` | `300` | — | `300` (region wins) |
| `graphqlApi.logRetentionInDays` | `7` | `30` | — | `30` (region wins) |
| `siteBucket.bucketName` | `site` | `site-eu` | — | `site-eu` (region wins) |
| `resourcePrefix` | `ge` | `ge-eu-west-1` | `myapp` | `myapp` (stage wins) |

## Resource Naming

### Default Pattern

```
[globalPrefix]-[resourcePrefix]-resourceName-[resourceSuffix]-[globalSuffix]-stage
```

### Examples

With `resourcePrefix: "myapp"` and `stage: "dev"`:

| Resource Name | Formatted Output |
|--------------|-----------------|
| `user-table` | `myapp-user-table-dev` |
| `api-function` | `myapp-api-function-dev` |

With `globalPrefix: "acme"`, `resourcePrefix: "myapp"`, and `stage: "prd"`:

| Resource Name | Formatted Output |
|--------------|-----------------|
| `user-table` | `acme-myapp-user-table-prd` |

### Per-Resource Overrides

Use `resourceNameOptions` to customise naming for specific resources:

```json
{
  "resourceNameOptions": {
    "my-special-bucket": {
      "prefix": "custom",
      "suffix": "v2",
      "globalPrefix": false,
      "globalSuffix": false
    },
    "legacy-table": {
      "exclude": true
    }
  }
}
```

| Option | Type | Description |
|--------|------|-------------|
| `exclude` | `boolean` | Skip all prefixes/suffixes, only append stage |
| `prefix` | `string` | Override resourcePrefix for this resource |
| `suffix` | `string` | Override resourceSuffix for this resource |
| `globalPrefix` | `boolean` | Include/exclude the global prefix |
| `globalSuffix` | `boolean` | Include/exclude the global suffix |

## Domain Name Resolution

The fully qualified domain name is computed as:

```
{subDomain}.{domainName}
```

For stage-aware domains (Route53 A records):

- **Non-production:** `{stage}.{subDomain}.{domainName}` (e.g., `tst.api.example.com`)
- **Production:** `{subDomain}.{domainName}` (e.g., `api.example.com`)
- **skipStageForARecords:** Forces production-style naming regardless of stage

## AWS CDK Configuration

### cdk.json Example

```json
{
  "app": "npx ts-node --prefer-ts-exts src/main.ts",
  "context": {
    "stage": "dev",
    "domainName": "example.com",
    "subDomain": "api",
    "region": "eu-west-1",
    "globalPrefix": "acme",
    "resourcePrefix": "myapp",
    "stageContextPath": "cdk-env",
    "extraContexts": [],
    "regionContexts": ["cdk-region/eu-west-1.json"]
  }
}
```

Deploy with a different stage:

```shell
cdk deploy -c stage=prd
```

## Azure Pulumi Configuration

Azure uses the [Pulumi Azure Native](https://www.pulumi.com/registry/packages/azure-native/) provider (`@pulumi/azure-native`), which provides 100% API coverage of Azure Resource Manager. This is the recommended provider over the classic `@pulumi/azure` provider.

`CommonAzureStackProps` shares the same base properties (`stage`, `domainName`, `subDomain`, `name`) from `@gradientedge/cdk-utils-common`, plus Azure-specific options.

### Pulumi.yaml Example

```yaml
name: my-azure-project
runtime: nodejs
config:
  stage: dev
  domainName: example.com
  resourcePrefix: myapp
  regionContexts:
    - pulumi-region/uksouth.json
```

### Azure Resource Naming

The `AzureResourceNameFormatter` follows the same pattern as AWS:

```
[globalPrefix]-[resourcePrefix]-resourceName-[resourceSuffix]-[globalSuffix]-stage
```

Key difference: Azure handles `undefined` resource names gracefully (converts to empty string).

### Azure-Specific Properties

| Property | Type | Description |
|----------|------|-------------|
| `resourceGroup` | `ResourceGroup` | The Azure resource group for all resources |
| `commonLogAnalyticsWorkspace` | `Workspace` | Shared Log Analytics workspace |

## Cloudflare Pulumi Configuration

Cloudflare uses `CommonCloudflareStackProps` with the same shared base properties. Cloudflare is a global anycast network and does not have a region concept, so `regionContexts` is not supported for Cloudflare stacks.

### Pulumi.yaml Example

```yaml
name: my-cloudflare-project
runtime: nodejs
config:
  stage: dev
  domainName: example.com
```

Cloudflare constructs use Pulumi's native naming conventions rather than a custom formatter.
