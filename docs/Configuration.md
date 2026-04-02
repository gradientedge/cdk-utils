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

Create a `cdkEnv/` directory in your project root with a JSON file per stage:

```
my-project/
├── cdk.json
├── cdkEnv/
│   ├── dev.json
│   ├── tst.json
│   ├── uat.json
│   └── prd.json
```

### Stage File Example

`cdkEnv/tst.json`:

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
2. `CommonStack` looks for `cdkEnv/{stage}.json`
3. Properties from the stage file are merged into the CDK context
4. Objects and arrays are deep-merged; primitives are overwritten

### Custom Stage Context Path

Override the default `cdkEnv/` directory:

```json
// cdk.json
{
  "context": {
    "stageContextPath": "config/environments"
  }
}
```

## Extra Contexts

Layer additional configuration files on top of the stage config:

```json
// cdk.json
{
  "context": {
    "extraContexts": [
      "config/shared.json",
      "config/secrets.json"
    ]
  }
}
```

Extra contexts are loaded before stage contexts, so stage-specific values take precedence.

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
    "stageContextPath": "cdkEnv",
    "extraContexts": []
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

Cloudflare uses `CommonCloudflareStackProps` with the same shared base properties.

### Pulumi.yaml Example

```yaml
name: my-cloudflare-project
runtime: nodejs
config:
  stage: dev
  domainName: example.com
```

Cloudflare constructs use Pulumi's native naming conventions rather than a custom formatter.
