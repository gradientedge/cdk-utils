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

export class EventManager {
  public createLambdaRule(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    lambdaFunction: lambda.Function,
    eventPattern?: any,
    scheduleExpression?: string
  ) {
    if (!props.rules || props.rules.length == 0) throw `Event rule props undefined`

    const ruleProps = props.rules.find((log: RuleProps) => log.key === key)
    if (!ruleProps) throw `Could not find Event rule props for key:${key}`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description:
        'Rule to send notification on new objects in data bucket to lambda function target',
      eventPattern: eventPattern,
      scheduleExpression: scheduleExpression,
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

    return eventRule
  }

  public createFargateTaskRule(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition,
    subnetIds: string[],
    role: iam.Role | iam.CfnRole,
    eventPattern?: any
  ) {
    if (!props.rules || props.rules.length == 0) throw `Event rule props undefined`

    const ruleProps = props.rules.find((log: RuleProps) => log.key === key)
    if (!ruleProps) throw `Could not find Event rule props for key:${key}`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification on new objects in data bucket to ecs task target',
      eventPattern: eventPattern,
      name: `${ruleProps.name}-${props.stage}`,
      state: ruleProps.state,
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

    return eventRule
  }
}
