import * as cdk from 'aws-cdk-lib'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as events from 'aws-cdk-lib/aws-events'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'

/**
 * @classdesc Provides operations on AWS IAM.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
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
    return new iam.PolicyStatement({
      actions: ['secretsmanager:GetSecretValue'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? [
        `arn:aws:secretsmanager:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:secret:*`,
      ],
    })
  }

  /**
   * @summary Method to create iam statement to put events
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutEvents(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['events:PutEvents'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to start stepfunction execution
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForStartExecution(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to poll queue
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPollQueue(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to invoke lambda function
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForInvokeLambda(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['lambda:InvokeFunction'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to read app config
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForReadAnyAppConfig(resourceArns?: string[]) {
    return new iam.PolicyStatement({
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
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to access app config
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForAppConfigExecution(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['appconfig:GetLatestConfiguration', 'appconfig:StartConfigurationSession'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to put xray telemetry
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutXrayTelemetry(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['xray:PutTraceSegments', 'xray:PutTelemetryRecords'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to decrypt kms
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForDecryptKms(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['kms:Decrypt'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to list s3 buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   */
  public statementForListBucket(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      actions: ['s3:ListBucket'],
      effect: iam.Effect.ALLOW,
      resources: [bucket.bucketArn],
    })
  }

  /**
   * @summary Method to create iam statement to list all s3 buckets
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForListAllMyBuckets(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['s3:ListAllMyBuckets'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to get s3 objects in buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForGetAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket, resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:GetObjectAcl'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to delete s3 objects in buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForDeleteAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket, resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['s3:DeleteObject'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to write s3 objects in buckets
   * @param scope scope in which this resource is defined
   * @param bucket
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket, resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to pass iam role
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPassRole(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to invalidate cloudfront cache
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForCloudfrontInvalidation(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to access efs
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForWriteEfs(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['elasticfilesystem:*'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam policy to invalidate cloudfront cache
   * @param resourceArns list of ARNs to allow access to
   */
  public policyForCloudfrontInvalidation(resourceArns?: string[]) {
    return new iam.PolicyDocument({
      statements: [
        this.statementForCreateAnyLogStream(),
        this.statementForPutAnyLogEvent(),
        this.statementForCloudfrontInvalidation(),
        new iam.PolicyStatement({
          actions: [
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetAuthorizationToken',
          ],
          effect: iam.Effect.ALLOW,
          resources: resourceArns ?? ['*'],
        }),
      ],
    })
  }

  /**
   * @summary Method to create iam role to invalidate cloudfront cache
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   */
  public roleForCloudfrontInvalidation(id: string, scope: CommonConstruct) {
    return new iam.Role(scope, `${id}-install-deps-project-role`, {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        codeBuildPolicy: this.policyForCloudfrontInvalidation(),
      },
    })
  }

  /**
   * @summary Method to create iam statement to assume iam role
   * @param scope scope in which this resource is defined
   * @param servicePrincipals
   */
  public statementForAssumeRole(scope: CommonConstruct, servicePrincipals: iam.ServicePrincipal[]) {
    return new iam.PolicyStatement({
      actions: ['sts:AssumeRole'],
      effect: iam.Effect.ALLOW,
      principals: servicePrincipals,
    })
  }

  /**
   * @summary Method to create iam statement to pass ecs role
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForEcsPassRole(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['iam:PassRole'],
      conditions: { StringLike: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to run ecs task
   * @param scope scope in which this resource is defined
   * @param cluster
   * @param task
   */
  public statementForRunEcsTask(scope: CommonConstruct, cluster: ecs.ICluster, task: ecs.ITaskDefinition) {
    return new iam.PolicyStatement({
      actions: ['ecs:RunTask'],
      conditions: { ArnLike: { 'ecs:cluster': cluster.clusterArn } },
      effect: iam.Effect.ALLOW,
      resources: [task.taskDefinitionArn],
    })
  }

  /**
   * @summary Method to create iam statement to create log stream
   * @param scope scope in which this resource is defined
   * @param logGroup
   */
  public statementForCreateLogStream(scope: CommonConstruct, logGroup: logs.CfnLogGroup) {
    return new iam.PolicyStatement({
      actions: ['logs:CreateLogStream'],
      effect: iam.Effect.ALLOW,
      resources: [
        `arn:aws:logs:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:log-group:${
          logGroup.logGroupName
        }:log-stream:${cdk.Stack.of(scope).account}_CloudTrail_eu-west-1*`,
      ],
      sid: 'AWSCloudTrailCreateLogStream2014110',
    })
  }

  /**
   * @summary Method to create iam statement to create any log stream
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForCreateAnyLogStream(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['logs:CreateLogStream'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to write log events
   * @param scope scope in which this resource is defined
   * @param logGroup
   */
  public statementForPutLogEvent(scope: CommonConstruct, logGroup: logs.CfnLogGroup) {
    return new iam.PolicyStatement({
      actions: ['logs:PutLogEvents'],
      effect: iam.Effect.ALLOW,
      resources: [
        `arn:aws:logs:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:log-group:${
          logGroup.logGroupName
        }:log-stream:${cdk.Stack.of(scope).account}_CloudTrail_eu-west-1*`,
      ],
      sid: 'AWSCloudTrailPutLogEvents20141101',
    })
  }

  /**
   * @summary Method to create iam statement to write any log events
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForPutAnyLogEvent(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['logs:PutLogEvents'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to read items from dynamodb table
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForReadTableItems(resourceArns?: string[]) {
    return new iam.PolicyStatement({
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
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to write items from dynamodb table
   * @param resourceArns list of ARNs to allow access to
   */
  public statementForWriteTableItems(resourceArns?: string[]) {
    return new iam.PolicyStatement({
      actions: ['dynamodb:BatchWriteItem', 'dynamodb:DeleteItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
      effect: iam.Effect.ALLOW,
      resources: resourceArns ?? ['*'],
    })
  }

  /**
   * @summary Method to create iam statement for cloud trail
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param logGroup
   */
  public createRoleForCloudTrail(id: string, scope: CommonConstruct, logGroup: logs.CfnLogGroup) {
    const policy = new iam.PolicyDocument({
      statements: [this.statementForCreateLogStream(scope, logGroup), this.statementForPutLogEvent(scope, logGroup)],
    })
    const role = new iam.CfnRole(scope, `${id}`, {
      assumeRolePolicyDocument: new iam.PolicyDocument({
        statements: [this.statementForAssumeRole(scope, [new iam.ServicePrincipal('cloudtrail.amazonaws.com')])],
      }),
      policies: [
        {
          policyDocument: policy,
          policyName: `${id}-policy-${scope.props.stage}`,
        },
      ],
      roleName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}Arn`, scope, role.attrArn)
    utils.createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for ecs event
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param cluster
   * @param task
   */
  public createRoleForEcsEvent(id: string, scope: CommonConstruct, cluster: ecs.ICluster, task: ecs.ITaskDefinition) {
    const policy = new iam.PolicyDocument({
      statements: [this.statementForRunEcsTask(scope, cluster, task), this.statementForEcsPassRole()],
    })

    const role = new iam.Role(scope, `${id}`, {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
      description: `Role for ${id} ECS Task execution from EventBridge`,
      inlinePolicies: { policy },
      roleName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}Arn`, scope, role.roleArn)
    utils.createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for ecs execution
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param policy
   */
  public createRoleForEcsExecution(id: string, scope: CommonConstruct, policy: iam.PolicyDocument) {
    const role = new iam.Role(scope, `${id}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `Role for ${id} ECS Task execution`,
      inlinePolicies: { policy },
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          scope,
          `${id}-AmazonECSTaskExecutionRolePolicy`,
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
      roleName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}Arn`, scope, role.roleArn)
    utils.createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for lambda execution
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param policy
   * @param servicePrinicpal
   */
  public createRoleForLambda(
    id: string,
    scope: CommonConstruct,
    policy: iam.PolicyDocument,
    servicePrinicpal?: iam.ServicePrincipal
  ) {
    const role = new iam.Role(scope, `${id}`, {
      assumedBy: servicePrinicpal ?? new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role for ${id} Lambda function`,
      inlinePolicies: { policy },
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          scope,
          `${id}-AWSLambdaBasicExecutionRole`,
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      roleName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}Arn`, scope, role.roleArn)
    utils.createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for step function execution
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param policy
   * @param servicePrinicpal
   */
  public createRoleForStepFunction(
    id: string,
    scope: CommonConstruct,
    policy: iam.PolicyDocument,
    servicePrinicpal?: iam.ServicePrincipal
  ) {
    const role = new iam.Role(scope, `${id}`, {
      assumedBy: servicePrinicpal ?? new iam.ServicePrincipal('states.amazonaws.com'),
      description: `Role for ${id} Lambda function`,
      inlinePolicies: { policy },
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          scope,
          `${id}-AWSLambdaBasicExecutionRole`,
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      roleName: `${id}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}Arn`, scope, role.roleArn)
    utils.createCfnOutput(`${id}Name`, scope, role.roleName)

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
    const role = new iam.Role(scope, `${id}`, {
      assumedBy: new iam.ServicePrincipal('pipes.amazonaws.com'),
      description: `Role for ${id} Pipe`,
      roleName: `${id}-${scope.props.stage}`,
    })

    role.addToPolicy(this.statementForPollQueue([queueArn]))
    role.addToPolicy(this.statementForStartExecution([stepFunctionArn]))

    utils.createCfnOutput(`${id}Arn`, scope, role.roleArn)
    utils.createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
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
    sqsQueue: sqs.Queue,
    eventBridgeRule: events.IRule,
    servicePrincipals?: iam.ServicePrincipal[]
  ) {
    return new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['sqs:*'],
          conditions: {
            ArnEquals: {
              'aws:SourceArn': eventBridgeRule,
            },
          },
          effect: iam.Effect.ALLOW,
          principals: servicePrincipals ?? [new iam.ServicePrincipal('events.amazonaws.com')],
          resources: [sqsQueue.queueArn],
        }),
      ],
    })
  }
}