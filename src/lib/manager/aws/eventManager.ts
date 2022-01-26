import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as events from 'aws-cdk-lib/aws-events'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category Application Integration
 * @summary Provides operations on AWS EventBridge.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.eventManager.createLambdaRule('MyLambdaRule', this, lambdaFunction)
 *   }
 * }
 *
 * @see [CDK EventBridge Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events-readme.html}
 */
export class EventManager {
  /**
   * @summary Method to create an eventbridge rule with lambda target
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.RuleProps} props
   * @param {lambda.Function} lambdaFunction
   * @param {string} eventBusName
   * @param {any} eventPattern
   * @param {string} scheduleExpression
   */
  public createLambdaRule(
    id: string,
    scope: common.CommonConstruct,
    props: types.RuleProps,
    lambdaFunction: lambda.Function,
    eventBusName?: string,
    eventPattern?: any,
    scheduleExpression?: string
  ) {
    if (!props) throw `EventRule props undefined`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification to lambda function target',
      eventBusName: eventBusName,
      eventPattern: eventPattern,
      scheduleExpression: scheduleExpression,
      name: `${props.name}-${scope.props.stage}`,
      state: props.state,
      targets: [{ arn: lambdaFunction.functionArn, id: `${id}-${scope.props.stage}` }],
    })

    new lambda.CfnPermission(scope, `${id}LambdaPermission`, {
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: eventRule.attrArn,
    })

    utils.createCfnOutput(`${id}-ruleArn`, scope, eventRule.attrArn)
    utils.createCfnOutput(`${id}-ruleName`, scope, eventRule.name)

    return eventRule
  }

  /**
   * @summary Method to create an eventbridge rule with fargate task target
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.RuleProps} props
   * @param {ecs.ICluster} cluster
   * @param {ecs.ITaskDefinition} task
   * @param {string[]} subnetIds
   * @param {iam.Role | iam.CfnRole} role
   * @param {any} eventPattern
   */
  public createFargateTaskRule(
    id: string,
    scope: common.CommonConstruct,
    props: types.RuleProps,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition,
    subnetIds: string[],
    role: iam.Role | iam.CfnRole,
    eventPattern?: any
  ) {
    if (!props) throw `EventRule props undefined`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification on new objects in data bucket to ecs task target',
      eventPattern: eventPattern,
      name: `${props.name}-${scope.props.stage}`,
      state: props.state,
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

    utils.createCfnOutput(`${id}-ruleArn`, scope, eventRule.attrArn)
    utils.createCfnOutput(`${id}-ruleName`, scope, eventRule.name)

    return eventRule
  }
}
