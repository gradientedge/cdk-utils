# Creating Custom Constructs

This guide walks through creating your own constructs by extending the CDK Utils base classes.

## Basic Pattern

Every custom construct follows this pattern:

```typescript
import { CommonConstruct, CommonStackProps } from '@gradientedge/cdk-utils-aws'
import { Construct } from 'constructs'

interface MyConstructProps extends CommonStackProps {
  // Add your custom properties
  bucketName: string
  enableNotifications: boolean
}

export class MyConstruct extends CommonConstruct {
  props: MyConstructProps

  constructor(parent: Construct, id: string, props: MyConstructProps) {
    super(parent, id, props)
    this.props = props
    this.initResources()
  }

  protected initResources() {
    // Use inherited service managers to create resources
    this.s3Manager.createBucket('MyBucket', this, {
      name: this.props.bucketName,
    })
  }
}
```

## What You Get for Free

When you extend `CommonConstruct`, every instance has:

### Service Managers

All 23 AWS service managers are available as properties:

```typescript
this.lambdaManager       // Lambda functions, layers, aliases
this.s3Manager           // S3 buckets, policies, notifications
this.dynamodbManager     // DynamoDB tables, indexes
this.apiManager          // API Gateway REST APIs
this.ecsManager          // ECS clusters, services, tasks
this.cloudFrontManager   // CloudFront distributions
this.route53Manager      // Route53 hosted zones, records
this.iamManager          // IAM roles, policies
this.snsManager          // SNS topics, subscriptions
this.sqsManager          // SQS queues
this.kmsManager          // KMS keys
this.efsManager          // EFS file systems
this.ecrManager          // ECR repositories
this.eksManager          // EKS clusters
this.eventManager        // EventBridge rules, buses
this.ssmManager          // SSM parameters
this.secretsManager      // Secrets Manager secrets
this.cloudTrailManager   // CloudTrail trails
this.cloudWatchManager   // CloudWatch alarms, dashboards
this.logManager          // CloudWatch log groups
this.sfnManager          // Step Functions state machines
this.wafManager          // WAF web ACLs
this.appConfigManager    // AppConfig applications
this.evidentlyManager    // Evidently features, experiments
this.vpcManager          // VPCs, subnets, security groups
```

### Utilities

```typescript
this.props                    // Typed configuration properties
this.resourceNameFormatter    // Consistent resource naming
this.fullyQualifiedDomainName // Computed FQDN

// Stage checks
this.isDevelopmentStage()     // true if stage === 'dev'
this.isTestStage()            // true if stage === 'tst'
this.isUatStage()             // true if stage === 'uat'
this.isProductionStage()      // true if stage === 'prd'

// CloudFormation outputs
this.addCfnOutput('OutputId', value, 'Description')
```

## Step-by-Step: REST API with DynamoDB

### 1. Define your props interface

```typescript
import { CommonStackProps, LambdaProps, DynamoDbProps } from '@gradientedge/cdk-utils-aws'

export interface UserServiceProps extends CommonStackProps {
  lambda: LambdaProps
  table: DynamoDbProps
  logLevel: string
  nodeEnv: string
  timezone: string
}
```

### 2. Create the construct

```typescript
import { CommonConstruct } from '@gradientedge/cdk-utils-aws'
import { Construct } from 'constructs'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { ITable } from 'aws-cdk-lib/aws-dynamodb'

export class UserService extends CommonConstruct {
  props: UserServiceProps
  userTable: ITable
  userFunction: IFunction

  constructor(parent: Construct, id: string, props: UserServiceProps) {
    super(parent, id, props)
    this.props = props
    this.initResources()
  }

  protected initResources() {
    this.createTable()
    this.createFunction()
  }

  private createTable() {
    this.userTable = this.dynamodbManager.createTable(
      'UserTable', this, this.props.table
    )
  }

  private createFunction() {
    this.userFunction = this.lambdaManager.createLambdaFunction(
      'UserFunction', this, this.props.lambda
    )

    // Grant the function read/write access to the table
    this.userTable.grantReadWriteData(this.userFunction)
  }
}
```

### 3. Use it in a stack

```typescript
import { CommonStack } from '@gradientedge/cdk-utils-aws'
import { App, StackProps } from 'aws-cdk-lib'

class UserServiceStack extends CommonStack {
  constructor(parent: App, name: string, props: StackProps) {
    super(parent, name, props)
  }
}

const app = new App()
new UserServiceStack(app, 'UserService', {
  env: { account: '123456789', region: 'eu-west-1' },
})
```

## Abstract Constructs

For constructs that define a lifecycle but let subclasses fill in specifics, use abstract methods:

```typescript
export abstract class BaseApi extends CommonConstruct {
  protected constructor(parent: Construct, id: string, props: BaseApiProps) {
    super(parent, id, props)
    this.props = props
  }

  protected initResources() {
    this.resolveHostedZone()
    this.resolveCertificate()
    this.createFunction()
    this.createApi()
    this.createApiResources()  // Subclass implements this
    this.createDomain()
  }

  // Force subclasses to define their API routes
  protected abstract createApiResources(): void
}
```

## Azure Constructs

The same pattern applies for Azure, extending `CommonAzureConstruct`. The Azure package uses the [Pulumi Azure Native](https://www.pulumi.com/registry/packages/azure-native/) provider (`@pulumi/azure-native`) for full Azure Resource Manager API coverage.

```typescript
import { CommonAzureConstruct } from '@gradientedge/cdk-utils-azure'
import * as pulumi from '@pulumi/pulumi'

export class MyAzureService extends CommonAzureConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }

  protected initResources() {
    this.storageManager.createStorageAccount('Storage', this, storageProps)
    this.functionManager.createFunctionApp('Function', this, functionProps)
  }
}
```

## Cloudflare Constructs

```typescript
import { CommonCloudflareConstruct } from '@gradientedge/cdk-utils-cloudflare'
import * as pulumi from '@pulumi/pulumi'

export class MySite extends CommonCloudflareConstruct {
  constructor(name: string, args: any, opts?: pulumi.ComponentResourceOptions) {
    super(name, args, opts)
    this.initResources()
  }

  protected initResources() {
    this.zoneManager.createZone('Zone', this, zoneProps)
    this.recordManager.createRecord('Record', this, recordProps)
    this.workerManager.createWorker('Worker', this, workerProps)
  }
}
```

## Tips

- **Name resources descriptively** — the `id` parameter is used in CloudFormation logical IDs and resource naming
- **Use stage checks** — `if (this.isProductionStage())` to conditionally configure resources (e.g., higher capacity in prod)
- **Leverage the formatter** — `this.resourceNameFormatter.format('my-resource')` ensures consistent naming
- **Keep constructs focused** — one construct per bounded context (e.g., UserService, PaymentService)
- **Props interfaces** — always extend `CommonStackProps` for type safety and access to base configuration
