import * as cdk from 'aws-cdk-lib'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { CommonConstruct } from '../common/commonConstruct'
import { createCfnOutput } from '../utils'

/**
 * @stability stable
 * @category Security, Identity & Compliance
 * @summary Provides operations on AWS IAM.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.iamManager.createRoleForEcsEvent('MyEcsRole', this, cluster, task)
 *   }
 * }
 *
 * @see [CDK IAM Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_iam-readme.html}
 */
export class IamManager {
  /**
   * @summary Method to create iam statement to read secrets
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public statementForReadSecrets(scope: CommonConstruct) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: [`arn:aws:secretsmanager:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:secret:*`],
    })
  }

  /**
   * @summary Method to create iam statement to read app config
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public statementForReadAnyAppConfig(scope: CommonConstruct) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
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
      resources: ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to list s3 buckets
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} bucket
   */
  public statementForListBucket(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [bucket.bucketArn],
    })
  }

  /**
   * @summary Method to create iam statement to list all s3 buckets
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public statementForListAllMyBuckets(scope: CommonConstruct) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListAllMyBuckets'],
      resources: ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to get s3 objects in buckets
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} bucket
   */
  public statementForGetAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:GetObjectAcl'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to delete s3 objects in buckets
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} bucket
   */
  public statementForDeleteAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:DeleteObject'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to write s3 objects in buckets
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} bucket
   */
  public statementForPutAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  /**
   * @summary Method to create iam statement to pass iam role
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public statementForPassRole(scope: CommonConstruct) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to invalidate cloudfront cache
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public statementForCloudfrontInvalidation(scope: CommonConstruct) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['cloudfront:GetInvalidation', 'cloudfront:CreateInvalidation'],
      resources: ['*'],
    })
  }

  /**
   * @summary Method to create iam policy to invalidate cloudfront cache
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public policyForCloudfrontInvalidation(scope: CommonConstruct) {
    return new iam.PolicyDocument({
      statements: [
        this.statementForCreateAnyLogStream(),
        this.statementForPutAnyLogEvent(),
        this.statementForCloudfrontInvalidation(scope),
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ecr:GetDownloadUrlForLayer',
            'ecr:BatchGetImage',
            'ecr:BatchCheckLayerAvailability',
            'ecr:GetAuthorizationToken',
          ],
          resources: ['*'],
        }),
      ],
    })
  }

  /**
   * @summary Method to create iam role to invalidate cloudfront cache
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public roleForCloudfrontInvalidation(id: string, scope: CommonConstruct) {
    return new iam.Role(scope, `${id}-install-deps-project-role`, {
      assumedBy: new iam.ServicePrincipal('codebuild.amazonaws.com'),
      inlinePolicies: {
        codeBuildPolicy: this.policyForCloudfrontInvalidation(scope),
      },
    })
  }

  /**
   * @summary Method to create iam statement to assume iam role
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {iam.ServicePrincipal[]} servicePrincipals
   */
  public statementForAssumeRole(scope: CommonConstruct, servicePrincipals: iam.ServicePrincipal[]) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      principals: servicePrincipals,
    })
  }

  /**
   * @summary Method to create iam statement to pass ecs role
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public statementForEcsPassRole(scope: CommonConstruct) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: { StringLike: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
    })
  }

  /**
   * @summary Method to create iam statement to run ecs task
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {ecs.ICluster} cluster
   * @param {ecs.ITaskDefinition} task
   */
  public statementForRunEcsTask(scope: CommonConstruct, cluster: ecs.ICluster, task: ecs.ITaskDefinition) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ecs:RunTask'],
      resources: [task.taskDefinitionArn],
      conditions: { ArnLike: { 'ecs:cluster': cluster.clusterArn } },
    })
  }

  /**
   * @summary Method to create iam statement to create log stream
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {logs.CfnLogGroup} logGroup
   */
  public statementForCreateLogStream(scope: CommonConstruct, logGroup: logs.CfnLogGroup) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:CreateLogStream'],
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
   */
  public statementForCreateAnyLogStream() {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:CreateLogStream'],
      resources: ['*'],
    })
  }

  /**
   * @summary Method to create iam statement to write log events
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {logs.CfnLogGroup} logGroup
   */
  public statementForPutLogEvent(scope: CommonConstruct, logGroup: logs.CfnLogGroup) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:PutLogEvents'],
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
   */
  public statementForPutAnyLogEvent() {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['logs:PutLogEvents'],
      resources: ['*'],
    })
  }

  /**
   * @summary Method to create iam statement for cloud trail
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {logs.CfnLogGroup} logGroup
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
          policyName: `${id}-policy-${scope.props.stage}`,
          policyDocument: policy,
        },
      ],
      roleName: `${id}-${scope.props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, role.attrArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for ecs event
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {ecs.ICluster} cluster
   * @param {ecs.ITaskDefinition} task
   */
  public createRoleForEcsEvent(id: string, scope: CommonConstruct, cluster: ecs.ICluster, task: ecs.ITaskDefinition) {
    const policy = new iam.PolicyDocument({
      statements: [this.statementForRunEcsTask(scope, cluster, task), this.statementForEcsPassRole(scope)],
    })

    const role = new iam.Role(scope, `${id}`, {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
      description: `Role for ${id} ECS Task execution from EventBridge`,
      inlinePolicies: { policy },
      roleName: `${id}-${scope.props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for ecs execution
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {iam.PolicyDocument} policy
   */
  public createRoleForEcsExecution(id: string, scope: CommonConstruct, policy: iam.PolicyDocument) {
    const role = new iam.Role(scope, `${id}`, {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: `Role for ${id} ECS Task execution`,
      inlinePolicies: { policy },
      managedPolicies: [
        iam.ManagedPolicy.fromManagedPolicyArn(
          scope,
          'AmazonECSTaskExecutionRolePolicy',
          'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
      roleName: `${id}-${scope.props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  /**
   * @summary Method to create iam statement for lambda execution
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {iam.PolicyDocument} policy
   */
  public createRoleForLambda(id: string, scope: CommonConstruct, policy: iam.PolicyDocument) {
    const role = new iam.Role(scope, `${id}`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
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

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }
}
