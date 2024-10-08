import { Stack } from 'aws-cdk-lib'
import { ICluster, ITaskDefinition } from 'aws-cdk-lib/aws-ecs'
import { IRule } from 'aws-cdk-lib/aws-events'
import {
  CfnRole,
  Effect,
  ManagedPolicy,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam'
import { CfnLogGroup } from 'aws-cdk-lib/aws-logs'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'

/**
 * @classdesc Provides operations on AWS
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.iamManager.createRoleForEcsEvent('MyEcsRole', this, cluster, task)
 *   }
 * }
 * @see [CDK IAM Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam-readme.html}
 */
export class IamManager {
  /**
   * @summary Method to create iam statement to read secrets
   * @param scope scope in which this resource is defined
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForReadSecrets(scope: CommonConstruct, resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? [
        `arn:aws:secretsmanager:${Stack.of(scope).region}:${Stack.of(scope).account}:secret:*`,
      ],
    })
  }

  /**
   * @summary Method to create iam statement to put events
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutEvents(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['events:PutEvents'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to start step function execution
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForStartExecution(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['states:StartExecution'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to poll queue
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPollQueue(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to invoke lambda function
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForInvokeLambda(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to read app config
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForReadAnyAppConfig(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: [
        'ssm:GetDocument',
        'ssm:ListDocuments',
        'appconfig:ListApplications',
        'appconfig:GetApplication',
        'appconfig:ListEnvironments',
        'appconfig:GetEnvironment',
        'appconfig:ListConfigurationProfiles',
        'appconfig:GetConfigurationProfile',
        'appconfig:ListDeploymentStrategies',
        'appconfig:GetDeploymentStrategy',
        'appconfig:GetConfiguration',
        'appconfig:ListDeployments',
      ],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to access app config
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForAppConfigExecution(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['appconfig:GetLatestConfiguration', 'appconfig:StartConfigurationSession'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to put xray telemetry
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutXrayTelemetry(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to decrypt kms
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForDecryptKms(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['kms:Decrypt'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to list s3 buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   */
  public statementForListBucket(scope: CommonConstruct, bucket: IBucket) {
    return new PolicyStatement({
      actions: ['s3:ListBucket'],
      effect: Effect.ALLOW,
      resources: [bucket.bucketArn],
    })
  }

  /**
   * @summary Method to create iam statement to list all s3 buckets
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForListAllMyBuckets(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['s3:ListAllMyBuckets'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to get s3 objects in buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForGetAnyS3Objects(scope: CommonConstruct, bucket: IBucket, resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['s3:GetObject', 's3:GetObjectAcl'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to delete s3 objects in buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForDeleteAnyS3Objects(scope: CommonConstruct, bucket: IBucket, resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['s3:DeleteObject'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to write s3 objects in buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutAnyS3Objects(scope: CommonConstruct, bucket: IBucket, resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to pass iam role
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPassRole(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['iam:PassRole'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to invalidate cloudfront cache
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForCloudfrontInvalidation(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to access efs
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForWriteEfs(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['elasticfilesystem:*'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to assume iam role
   * @param scope scope in which this resource is defined
   * @param servicePrincipals
   */
  public statementForAssumeRole(scope: CommonConstruct, servicePrincipals: ServicePrincipal[]) {
    return new PolicyStatement({
      actions: ['sts:AssumeRole'],
      effect: Effect.ALLOW,
      principals: servicePrincipals,
    })
  }

  /**
   * @summary Method to create iam statement to pass ecs role
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForEcsPassRole(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['iam:PassRole'],
      conditions: { StringLike: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to run ecs task
   * @param scope scope in which this resource is defined
   * @param cluster
   * @param task
   */
  public statementForRunEcsTask(scope: CommonConstruct, cluster: ICluster, task: ITaskDefinition) {
    return new PolicyStatement({
      actions: ['ecs:RunTask'],
      conditions: { ArnLike: { 'ecs:cluster': cluster.clusterArn } },
      effect: Effect.ALLOW,
      resources: [task.taskDefinitionArn],
    })
  }

  /**
   * @summary Method to create iam statement to create log stream
   * @param scope scope in which this resource is defined
   * @param logGroup
   */
  public statementForCreateLogStream(scope: CommonConstruct, logGroup: CfnLogGroup) {
    return new PolicyStatement({
      actions: ['logs:CreateLogStream'],
      effect: Effect.ALLOW,
      resources: [
        `arn:aws:logs:${Stack.of(scope).region}:${Stack.of(scope).account}:log-group:${
          logGroup.logGroupName
        }:log-stream:${Stack.of(scope).account}_CloudTrail_eu-west-1*`,
      ],
      sid: 'AWSCloudTrailCreateLogStream2014110',
    })
  }

  /**
   * @summary Method to create iam statement to create any log stream
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForCreateAnyLogStream(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['logs:CreateLogStream'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to write log events
   * @param scope scope in which this resource is defined
   * @param logGroup
   */
  public statementForPutLogEvent(scope: CommonConstruct, logGroup: CfnLogGroup) {
    return new PolicyStatement({
      actions: ['logs:PutLogEvents'],
      effect: Effect.ALLOW,
      resources: [
        `arn:aws:logs:${Stack.of(scope).region}:${Stack.of(scope).account}:log-group:${
          logGroup.logGroupName
        }:log-stream:${Stack.of(scope).account}_CloudTrail_eu-west-1*`,
      ],
      sid: 'AWSCloudTrailPutLogEvents20141101',
    })
  }

  /**
   * @summary Method to create iam statement to write any log events
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutAnyLogEvent(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['logs:PutLogEvents'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to read items from dynamodb table
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForReadTableItems(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: [
        'dynamodb:PartiQLSelect',
        'dynamodb:DescribeTable',
        'dynamodb:ListTables',
        'dynamodb:GetItem',
        'dynamodb:Scan',
        'dynamodb:Query',
        'dynamodb:GetRecords',
        'dynamodb:BatchGetItem',
      ],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to write items from dynamodb table
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForWriteTableItems(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['dynamodb:BatchWriteItem', 'dynamodb:DeleteItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to poll from dynamodb table
   * @param resourceArns list of ARNs to allow access to
   */
  public statementFordynamoDbStream(resourceArns?: string[]) {
    return new PolicyStatement({
      actions: ['dynamodb:DescribeStream', 'dynamodb:GetRecords', 'dynamodb:GetShardIterator', 'dynamodb:ListStreams'],
      effect: Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam policy to invalidate cloudfront cache
   * @param resourceArns list of ARNs to allow access to
   */
  public createPolicyForCloudfrontInvalidation(resourceArns?: string[]) {
    return new PolicyDocument({
      statements: [
        this.statementForCreateAnyLogStream(),
        this.statementForPutAnyLogEvent(),
        this.statementForCloudfrontInvalidation(),
        new PolicyStatement({
          actions: [
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetAuthorizationToken',
          ],
          effect: Effect.ALLOW,
          resources: resourceArns ?? ['*'],
        }),
      ],
    })
  }

  /**
   * @summary Method to create iam policy for sqs
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param sqsQueue
   * @param eventBridgeRule
   * @param servicePrincipals
   */
  public createPolicyForSqsEvent(
    id: string,
    scope: CommonConstruct,
    sqsQueue: Queue,
    eventBridgeRule: IRule,
    servicePrincipals?: ServicePrincipal[]
  ) {
    return new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['sqs:*'],
          conditions: {
            ArnEquals: {
              'aws:SourceArn': eventBridgeRule,
            },
          },
          effect: Effect.ALLOW,
          principals: servicePrincipals ?? [new ServicePrincipal('events.amazonaws.com')],
          resources: [sqsQueue.queueArn],
        }),
      ],
    })
  }

  /**
   * @summary Method to create iam role to invalidate cloudfront cache
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   */
  public createRoleForCloudfrontInvalidation(id: string, scope: CommonConstruct) {
    return new Role(scope, `${id}-install-deps-project-role`, {
      assumedBy: new ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        codeBuildPolicy: this.createPolicyForCloudfrontInvalidation(),
      },
      roleName: scope.resourceNameFormatter.format(`${id}-cf-invalidation`, scope.props.resourceNameOptions?.iam),
    })
  }

  /**
   * @summary Method to create iam statement for cloud trail
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param logGroup
   */
  public createRoleForCloudTrail(id: string, scope: CommonConstruct, logGroup: CfnLogGroup) {
    const policy = new PolicyDocument({
      statements: [this.statementForCreateLogStream(scope, logGroup), this.statementForPutLogEvent(scope, logGroup)],
    })
    const role = new CfnRole(scope, `${id}`, {
      assumeRolePolicyDocument: new PolicyDocument({
        statements: [this.statementForAssumeRole(scope, [new ServicePrincipal('cloudtrail.amazonaws.com')])],
      }),
      policies: [
        {
          policyDocument: policy,
          policyName: scope.resourceNameFormatter.format(`${id}-policy`),
        },
      ],
      roleName: scope.resourceNameFormatter.format(`${id}-trail`, scope.props.resourceNameOptions?.iam),
    })

    createCfnOutput(`${id}Arn`, scope, role.attrArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for ecs event
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param cluster
   * @param task
   */
  public createRoleForEcsEvent(id: string, scope: CommonConstruct, cluster: ICluster, task: ITaskDefinition) {
    const policy = new PolicyDocument({
      statements: [this.statementForRunEcsTask(scope, cluster, task), this.statementForEcsPassRole()],
    })

    const role = new Role(scope, `${id}`, {
      assumedBy: new ServicePrincipal('events.amazonaws.com'),
      description: `Role for ${id} ECS Task execution from EventBridge`,
      inlinePolicies: { policy },
      roleName: scope.resourceNameFormatter.format(`${id}-ecs-event`, scope.props.resourceNameOptions?.iam),
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for ecs execution
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param policy
   */
  public createRoleForEcsExecution(id: string, scope: CommonConstruct, policy: PolicyDocument) {
    const role = new Role(scope, `${id}`, {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `Role for ${id} ECS Task execution`,
      inlinePolicies: { policy },
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(
          scope,
          `${id}-AmazonECSTaskExecutionRolePolicy`,
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
      roleName: scope.resourceNameFormatter.format(`${id}-ecs-exec`, scope.props.resourceNameOptions?.iam),
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for lambda execution
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param policy
   * @param servicePrincipal
   */
  public createRoleForLambda(
    id: string,
    scope: CommonConstruct,
    policy: PolicyDocument,
    servicePrincipal?: ServicePrincipal
  ) {
    const role = new Role(scope, `${id}`, {
      assumedBy: servicePrincipal ?? new ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for ${id} Lambda function`,
      inlinePolicies: { policy },
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(
          scope,
          `${id}-AWSLambdaBasicExecutionRole`,
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      roleName: scope.resourceNameFormatter.format(`${id}-lambda`, scope.props.resourceNameOptions?.iam),
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for appconfig secrets manager integration
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param policy
   * @param servicePrincipal
   */
  public createRoleForAppConfigSecrets(
    id: string,
    scope: CommonConstruct,
    policy: PolicyDocument,
    servicePrincipal?: ServicePrincipal
  ) {
    const role = new Role(scope, `${id}`, {
      assumedBy: servicePrincipal ?? new ServicePrincipal('appconfig.amazonaws.com'),
      description: `Role for ${id} AppConfig Secrets`,
      inlinePolicies: { policy },
      roleName: scope.resourceNameFormatter.format(`${id}-config`, scope.props.resourceNameOptions?.iam),
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for step function execution
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param policy
   * @param servicePrincipal
   */
  public createRoleForStepFunction(
    id: string,
    scope: CommonConstruct,
    policy: PolicyDocument,
    servicePrincipal?: ServicePrincipal
  ) {
    const role = new Role(scope, `${id}`, {
      assumedBy: servicePrincipal ?? new ServicePrincipal('states.amazonaws.com'),
      description: `Role for ${id} Lambda function`,
      inlinePolicies: { policy },
      managedPolicies: [
        ManagedPolicy.fromManagedPolicyArn(
          scope,
          `${id}-AWSLambdaBasicExecutionRole`,
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      roleName: scope.resourceNameFormatter.format(`${id}-sfn-exec`, scope.props.resourceNameOptions?.iam),
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for sqs to step function pipe
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param queueArn the arn of the sqs queue
   * @param stepFunctionArn the arn of the step function
   */
  public createRoleForSqsToSfnPipe(id: string, scope: CommonConstruct, queueArn: string, stepFunctionArn: string) {
    const role = new Role(scope, `${id}`, {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      description: `Role for ${id} Pipe`,
      roleName: scope.resourceNameFormatter.format(`${id}-pipe`, scope.props.resourceNameOptions?.iam),
    })

    role.addToPolicy(this.statementForPollQueue([queueArn]))
    role.addToPolicy(this.statementForStartExecution([stepFunctionArn]))

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for sqs to lambda pipe
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param queueArn the arn of the sqs queue
   * @param lambdaArn the arn of the lambda function
   */
  public createRoleForSqsToLambdaPipe(id: string, scope: CommonConstruct, queueArn: string, lambdaArn: string) {
    const role = new Role(scope, `${id}`, {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      description: `Role for ${id} Pipe`,
      roleName: scope.resourceNameFormatter.format(`${id}-pipe`, scope.props.resourceNameOptions?.iam),
    })

    role.addToPolicy(this.statementForPollQueue([queueArn]))
    role.addToPolicy(this.statementForInvokeLambda([lambdaArn]))

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for dynamoDb to lambda function pipe
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param dynamoDbStreamArn the arn of the dynamoDb Stream queue
   * @param lambdaFunctionArn the arn of the lambda function
   */
  public createRoleForDynamoDbToLambdaPipe(
    id: string,
    scope: CommonConstruct,
    dynamoDbStreamArn: string,
    lambdaFunctionArn: string
  ) {
    const role = new Role(scope, `${id}`, {
      assumedBy: new ServicePrincipal('pipes.amazonaws.com'),
      description: `Role for ${id} Pipe`,
      roleName: scope.resourceNameFormatter.format(`${id}-pipe`, scope.props.resourceNameOptions?.iam),
    })

    role.addToPolicy(this.statementFordynamoDbStream([dynamoDbStreamArn]))
    role.addToPolicy(this.statementForInvokeLambda([lambdaFunctionArn]))

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }
}
