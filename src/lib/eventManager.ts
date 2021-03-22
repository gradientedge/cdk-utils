import * as ecs from '@aws-cdk/aws-ecs'
import * as events from '@aws-cdk/aws-events'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { CommonConstruct } from './commonConstruct'
import { RuleProps } from './types'
import { createCfnOutput } from './genericUtils'
import { resolveSrv } from 'dns'

/**
 * @category Application Integration
 * @summary Provides operations on AWS EventBridge.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.eventManager.createLambdaRule('MyLambdaRule', this, lambdaFunction)
 * }
 *
 * @see [CDK EventBridge Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-events-readme.html}</li></i>
 */
export class EventManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {lambda.Function} lambdaFunction
   * @param {string} eventBusName
   * @param {any} eventPattern
   * @param {string} scheduleExpression
   */
  public createLambdaRule(
    id: string,
    scope: CommonConstruct,
    lambdaFunction: lambda.Function,
    eventBusName?: string,
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
   * @param {ecs.ICluster} cluster
   * @param {ecs.ITaskDefinition} task
   * @param {string[]} subnetIds
   * @param {iam.Role | iam.CfnRole} role
   * @param {any} eventPattern
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
