import * as cdk from '@aws-cdk/core'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export class IamManager {
  public statementForReadSecrets(scope: CommonConstruct, props: CommonStackProps) {
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

  public statementForListBucket(
    scope: CommonConstruct,
    props: CommonStackProps,
    bucket: s3.IBucket
  ) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListBucket'],
      resources: [bucket.bucketArn],
    })
  }

  public statementForListAllMyBuckets(scope: CommonConstruct, props: CommonStackProps) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:ListAllMyBuckets'],
      resources: ['*'],
    })
  }

  public statementForGetAnyS3Objects(
    scope: CommonConstruct,
    props: CommonStackProps,
    bucket: s3.IBucket
  ) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject', 's3:GetObjectAcl'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  public statementForDeleteAnyS3Objects(
    scope: CommonConstruct,
    props: CommonStackProps,
    bucket: s3.IBucket
  ) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:DeleteObject'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  public statementForPutAnyS3Objects(
    scope: CommonConstruct,
    props: CommonStackProps,
    bucket: s3.IBucket
  ) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:PutObject', 's3:PutObjectAcl'],
      resources: [bucket.arnForObjects(`*`)],
    })
  }

  public statementForPassRole(scope: CommonConstruct, props: CommonStackProps) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: ['*'],
    })
  }

  public statementForAssumeRole(
    scope: CommonConstruct,
    props: CommonStackProps,
    servicePrincipals: iam.ServicePrincipal[]
  ) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sts:AssumeRole'],
      principals: servicePrincipals,
    })
  }

  public statementForEcsPassRole(scope: CommonConstruct, props: CommonStackProps) {
    return new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: { StringLike: { 'iam:PassedToService': 'ecs-tasks.amazonaws.com' } },
    })
  }

  public statementForRunEcsTask(
    scope: CommonConstruct,
    props: CommonStackProps,
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

  public statementForCreateLogStream(
    scope: CommonConstruct,
    props: CommonStackProps,
    logGroup: logs.CfnLogGroup
  ) {
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

  public statementForPutLogEvent(
    scope: CommonConstruct,
    props: CommonStackProps,
    logGroup: logs.CfnLogGroup
  ) {
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

  public createRoleForCloudTrail(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    logGroup: logs.CfnLogGroup
  ) {
    const policy = new iam.PolicyDocument({
      statements: [
        this.statementForCreateLogStream(scope, props, logGroup),
        this.statementForPutLogEvent(scope, props, logGroup),
      ],
    })
    const role = new iam.CfnRole(scope, `${id}`, {
      assumeRolePolicyDocument: new iam.PolicyDocument({
        statements: [
          this.statementForAssumeRole(scope, props, [
            new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
          ]),
        ],
      }),
      policies: [
        {
          policyName: `${id}-policy-${props.stage}`,
          policyDocument: policy,
        },
      ],
      roleName: `${id}-${props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, role.attrArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  public createRoleForEcsEvent(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition
  ) {
    const policy = new iam.PolicyDocument({
      statements: [
        this.statementForRunEcsTask(scope, props, cluster, task),
        this.statementForEcsPassRole(scope, props),
      ],
    })

    const role = new iam.Role(scope, `${id}`, {
      assumedBy: new iam.ServicePrincipal('events.amazonaws.com'),
      description: `Role for ${id} ECS Task execution from EventBridge`,
      inlinePolicies: { policy },
      roleName: `${id}-${props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  public createRoleForEcsExecution(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    policy: iam.PolicyDocument
  ) {
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
      roleName: `${id}-${props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }

  public createRoleForLambda(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    policy: iam.PolicyDocument
  ) {
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
      roleName: `${id}-${props.stage}`,
    })

    createCfnOutput(`${id}Arn`, scope, role.roleArn)
    createCfnOutput(`${id}Name`, scope, role.roleName)

    return role
  }
}
