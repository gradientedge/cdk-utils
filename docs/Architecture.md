# Architecture

This document explains the design principles, patterns, and structure behind CDK Utils.

## Design Principles

- **Convention over configuration** — sensible defaults with the ability to override
- **Composition through inheritance** — extend base constructs, get all service managers for free
- **Cloud-agnostic patterns** — consistent API across AWS CDK, Azure Pulumi, and Cloudflare Pulumi
- **Stage-aware** — resource naming, configuration, and domain handling adapt to the deployment stage

## Package Architecture

```
@gradientedge/cdk-utils (umbrella)
├── @gradientedge/cdk-utils-aws        → AWS CDK
├── @gradientedge/cdk-utils-azure      → Azure Pulumi (Azure Native provider)
├── @gradientedge/cdk-utils-cloudflare → Cloudflare Pulumi
└── @gradientedge/cdk-utils-common     → Shared types, enums, utilities
```

> **Note:** The Azure package uses the [Pulumi Azure Native](https://www.pulumi.com/registry/packages/azure-native/) provider (`@pulumi/azure-native`), which provides 100% API coverage of Azure Resource Manager. This is the recommended provider over the classic `@pulumi/azure` provider.

Each cloud-specific package follows the same internal structure:

```
packages/<cloud>/src/
├── common/           Base constructs, stacks, types, resource naming
├── construct/        High-level patterns combining multiple resources
├── services/         Individual service manager classes
└── index.ts          Public API exports
```

## Core Abstractions

### Stack → Construct → Service Managers

The core pattern flows from top to bottom:

**Stack** (entry point) creates a **Construct** (resource orchestrator), which injects **Service Managers** (resource creators):

```
CommonStack
  └── CommonConstruct
        ├── LambdaManager
        ├── S3Manager
        ├── DynamodbManager
        ├── ApiManager
        ├── ... (23 managers total for AWS)
        └── ResourceNameFormatter
```

### CommonStack

The stack is responsible for:

1. Loading **stage-specific configuration** from JSON files
2. Loading **extra contexts** for configuration layering
3. Extracting `CommonStackProps` from the CDK context
4. Creating the root `CommonConstruct` instance

### CommonConstruct

The construct is the base class all custom infrastructure extends. It:

1. Instantiates all service managers as public properties
2. Provides a `ResourceNameFormatter` for consistent naming
3. Computes the fully qualified domain name
4. Provides stage-checking utilities (`isDevelopmentStage()`, `isProductionStage()`, etc.)

### Service Managers

Service managers are stateless utility classes. Each one wraps a specific AWS/Azure/Cloudflare service:

```typescript
// Managers are instantiated without parameters
this.lambdaManager = new LambdaManager()
this.s3Manager = new S3Manager()
```

Every manager method takes the construct `scope` as a parameter, giving it access to:

- `scope.props` — all configuration properties
- `scope.resourceNameFormatter` — consistent naming
- Other managers via `scope.<managerName>`

**Example method signature:**

```typescript
public createLambdaFunction(
  id: string,
  scope: CommonConstruct,
  props: LambdaProps
): IFunction
```

## Resource Naming

All resources are named using the `ResourceNameFormatter`:

```
[globalPrefix]-[resourcePrefix]-resourceName-[resourceSuffix]-[globalSuffix]-stage
```

- **globalPrefix/globalSuffix** — org-wide identifiers
- **resourcePrefix/resourceSuffix** — project-level identifiers
- **stage** — always appended (dev, tst, uat, prd)

Per-resource overrides are available via `resourceNameOptions` in props.

## Configuration Hierarchy

Configuration loads in layers, with later layers overriding earlier ones:

```
1. cdk.json (base context)
   ↓ merged with
2. Extra context files (from extraContexts array)
   ↓ merged with
3. Stage-specific file (cdkEnv/{stage}.json)
   ↓ produces
4. CommonStackProps
```

- Objects and arrays are deep-merged (via lodash `_.merge`)
- Primitive values are overwritten

## Cross-Cloud Compatibility

| Concept | AWS CDK | Azure Pulumi | Cloudflare Pulumi |
|---------|---------|--------------|-------------------|
| Base class | `Construct` | `ComponentResource` | `ComponentResource` |
| Provider | AWS CDK | `@pulumi/azure-native` (Azure Native) | `@pulumi/cloudflare` |
| Stack | `CommonStack` | `CommonAzureStack` | `CommonCloudflareStack` |
| Construct | `CommonConstruct` | `CommonAzureConstruct` | `CommonCloudflareConstruct` |
| Managers | 23 services | 16 services | 10 services |
| Naming | `ResourceNameFormatter` | `AzureResourceNameFormatter` | (uses Pulumi naming) |

All three share:

- Stage detection utilities from `@gradientedge/cdk-utils-common`
- The same property patterns (`stage`, `domainName`, `subDomain`)
- Consistent inheritance model (extend the base construct, call `initResources()`)

## Construct Lifecycle

When creating a custom construct:

```typescript
class MyConstruct extends CommonConstruct {
  constructor(parent: Construct, id: string, props: MyProps) {
    super(parent, id, props)  // 1. Injects all service managers
    this.props = props
    this.id = id
    this.initResources()      // 2. Kicks off resource creation
  }

  protected initResources() {
    this.resolveHostedZone()   // 3. Resolve existing resources
    this.createBucket()        // 4. Create new resources
    this.createFunction()      // 5. Wire resources together
  }
}
```

Pre-built constructs like `RestApiLambda` follow this pattern with a defined initialization pipeline:

1. Resolve secrets
2. Resolve hosted zone and certificate
3. Create IAM policy and role
4. Create Lambda environment, layers, and function
5. Create REST API and wire to Lambda
6. Create custom domain and base path mappings
7. Create Route53 DNS records
