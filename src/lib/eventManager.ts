import * as ecs from '@aws-cdk/aws-ecs'
import * as events from '@aws-cdk/aws-events'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { CommonConstruct } from './commonConstruct'
import { RuleProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
 *
 */
export class EventManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param lambdaFunction
   * @param eventBusName
   * @param eventPattern
   * @param scheduleExpression
   */
  public createLambdaRule(
    id: string,
    scope: CommonConstruct,
    lambdaFunction: lambda.Function,
    eventBusName?: any,
    eventPattern?: any,
    scheduleExpression?: string
  ) {
    if (!scope.props.rules || scope.props.rules.length == 0) throw `Event rule props undefined`

    const ruleProps = scope.props.rules.find((log: RuleProps) => log.id === id)
    if (!ruleProps) throw `Could not find Event rule props for id:${id}`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification to lambda function target',
      eventBusName: eventBusName,
      eventPattern: eventPattern,
      scheduleExpression: scheduleExpression,
      name: `${ruleProps.name}-${scope.props.stage}`,
      state: ruleProps.state,
      targets: [{ arn: lambdaFunction.functionArn, id: `${id}-${scope.props.stage}` }],
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

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param cluster
   * @param task
   * @param subnetIds
   * @param role
   * @param eventPattern
   */
  public createFargateTaskRule(
    id: string,
    scope: CommonConstruct,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition,
    subnetIds: string[],
    role: iam.Role | iam.CfnRole,
    eventPattern?: any
  ) {
    if (!scope.props.rules || scope.props.rules.length == 0) throw `Event rule props undefined`

    const ruleProps = scope.props.rules.find((log: RuleProps) => log.id === id)
    if (!ruleProps) throw `Could not find Event rule props for id:${id}`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification on new objects in data bucket to ecs task target',
      eventPattern: eventPattern,
      name: `${ruleProps.name}-${scope.props.stage}`,
      state: ruleProps.state,
      targets: [
        {
          arn: cluster.clusterArn,
          id: `${id}-${scope.props.stage}`,
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
