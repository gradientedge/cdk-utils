import * as ecs from '@aws-cdk/aws-ecs'
import * as events from '@aws-cdk/aws-events'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface RuleProps extends events.CfnRuleProps {
  key: string
}

export function eventPatternForNewS3Objects(bucket: s3.IBucket) {
  return {
    source: ['aws.buckets'],
    'detail-type': ['AWS API Call via CloudTrail'],
    detail: {
      eventSource: ['buckets.amazonaws.com'],
      eventName: ['PutObject', 'CompleteMultipartUpload'],
      requestParameters: { bucketName: [bucket.bucketName] },
    },
  }
}

export class EventManager {
  public createRuleForS3ToLambda(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    bucket: s3.IBucket,
    lambdaFunction: lambda.Function
  ) {
    if (!props.rules || props.rules.length == 0) throw `Event rule props undefined`

    const ruleProps = props.rules.find((log: RuleProps) => log.key === key)
    if (!ruleProps) throw `Could not find Event rule props for key:${key}`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description:
        'Rule to send notification on new objects in data bucket to lambda function target',
      eventPattern: eventPatternForNewS3Objects(bucket),
      name: `${ruleProps.name}-${props.stage}`,
      state: ruleProps.state,
      targets: [{ arn: lambdaFunction.functionArn, id: `${id}-${props.stage}` }],
    })

    new lambda.CfnPermission(scope, `${id}LambdaPermission`, {
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: eventRule.attrArn,
    })

    createCfnOutput(`${id}Arn`, scope, eventRule.attrArn)
    createCfnOutput(`${id}Name`, scope, eventRule.name)
    createCfnOutput(`${id}BusName`, scope, eventRule.eventBusName)

    return eventRule
  }

  public createRuleForS3ToEcs(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    bucket: s3.IBucket,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition,
    subnetIds: string[],
    role: iam.Role | iam.CfnRole
  ) {
    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification on new objects in data bucket to ecs task target',
      eventPattern: eventPatternForNewS3Objects(bucket),
      name: `${id}-${props.stage}`,
      state: 'ENABLED',
      targets: [
        {
          arn: cluster.clusterArn,
          id: `${id}-${props.stage}`,
          ecsParameters: {
            launchType: 'FARGATE',
            networkConfiguration: {
              awsVpcConfiguration: { assignPublicIp: 'ENABLED', subnets: subnetIds },
            },
            taskCount: 1,
            taskDefinitionArn: task.taskDefinitionArn,
          },
          roleArn: role instanceof iam.Role ? role.roleArn : role.attrArn,
        },
      ],
    })

    createCfnOutput(`${id}Arn`, scope, eventRule.attrArn)
    createCfnOutput(`${id}Name`, scope, eventRule.name)
    createCfnOutput(`${id}BusName`, scope, eventRule.eventBusName)

    return eventRule
  }
}
