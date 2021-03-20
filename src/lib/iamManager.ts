import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { createCfnOutput } from './genericUtils'

/**
 *
 */
export class IamManager {
  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public statementForReadSecrets(scope: CommonConstruct) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['secretsmanager:GetSecretValue'],
      resources: [
        `arn:aws:secretsmanager:${cdk.Stack.of(scope).region}:${
          cdk.Stack.of(scope).account
        }:secret:*`,
      ],
    })
  }

  /**
   *
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
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param bucket
   */
  public statementForListBucket(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [bucket.bucketArn],
    })
  }

  /**
   *
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
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param bucket
   */
  public statementForGetAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:GetObjectAcl'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param bucket
   */
  public statementForDeleteAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:DeleteObject'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param bucket
   */
  public statementForPutAnyS3Objects(scope: CommonConstruct, bucket: s3.IBucket) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  /**
   *
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
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param servicePrincipals
   */
  public statementForAssumeRole(scope: CommonConstruct, servicePrincipals: iam.ServicePrincipal[]) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      principals: servicePrincipals,
    })
  }

  /**
   *
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
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param cluster
   * @param task
   */
  public statementForRunEcsTask(
    scope: CommonConstruct,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition
  ) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['ecs:RunTask'],
      resources: [task.taskDefinitionArn],
      conditions: { ArnLike: { 'ecs:cluster': cluster.clusterArn } },
    })
  }

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param logGroup
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
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param logGroup
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
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param logGroup
   */
  public createRoleForCloudTrail(id: string, scope: CommonConstruct, logGroup: logs.CfnLogGroup) {
    const policy = new iam.PolicyDocument({
      statements: [
        this.statementForCreateLogStream(scope, logGroup),
        this.statementForPutLogEvent(scope, logGroup),
      ],
    })
    const role = new iam.CfnRole(scope, `${id}`, {
      assumeRolePolicyDocument: new iam.PolicyDocument({
        statements: [
          this.statementForAssumeRole(scope, [
            new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
          ]),
        ],
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
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param cluster
   * @param task
   */
  public createRoleForEcsEvent(
    id: string,
    scope: CommonConstruct,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition
  ) {
    const policy = new iam.PolicyDocument({
      statements: [
        this.statementForRunEcsTask(scope, cluster, task),
        this.statementForEcsPassRole(scope),
      ],
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
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
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
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param policy
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
