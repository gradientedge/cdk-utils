import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as events from 'aws-cdk-lib/aws-events'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as utils from '../../../utils'
import * as cdk from 'aws-cdk-lib'
import * as pipes from 'aws-cdk-lib/aws-pipes'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import { CommonConstruct } from '../../../common'
import { EventBusProps, EventRuleProps, RuleProps, SqsToSfnPipeProps } from './types'

/**
 * @classdesc Provides operations on AWS EventBridge.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.eventManager.createLambdaRule('MyLambdaRule', this, lambdaFunction)
 *   }
 * }
 * @see [CDK EventBridge Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events-readme.html}
 */
export class EventManager {
  /**
   * Method to create an event bus
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props event bus properties
   */
  public createEventBus(id: string, scope: CommonConstruct, props: EventBusProps) {
    if (!props) throw `EventBus props undefined for ${id}`

    const eventBus = new events.EventBus(scope, `${id}`, {
      eventBusName: `${props.eventBusName}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-eventBusName`, scope, `${props.eventBusName}-${scope.props.stage}`)
    utils.createCfnOutput(`${id}-eventBusArn`, scope, eventBus.eventBusArn)

    return eventBus
  }

  /**
   * Method to create an event rule
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props event rule properties
   * @param eventBus optional custom event bus
   * @param targets optional event targets
   */
  public createRule(
    id: string,
    scope: CommonConstruct,
    props: EventRuleProps,
    eventBus?: events.IEventBus,
    targets?: events.IRuleTarget[]
  ) {
    if (!props) throw `EventRule props undefined for ${id}`

    const rule = new events.Rule(scope, `${id}`, {
      description: props.description,
      enabled: props.enabled,
      eventBus: eventBus,
      eventPattern: props.eventPattern,
      ruleName: `${props.ruleName}-${scope.props.stage}`,
      schedule: props.schedule,
    })

    if (targets && targets.length > 0) {
      targets.forEach(target => {
        rule.addTarget(target)
      })
    }

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(rule).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-ruleArn`, scope, rule.ruleArn)
    utils.createCfnOutput(`${id}-ruleName`, scope, rule.ruleName)

    return rule
  }

  /**
   * @summary Method to create an eventbridge rule with lambda target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param lambdaFunction
   * @param eventBusName
   * @param eventPattern
   * @param scheduleExpression
   */
  public createLambdaRule(
    id: string,
    scope: CommonConstruct,
    props: RuleProps,
    lambdaFunction: lambda.Function,
    eventBusName?: string,
    eventPattern?: any,
    scheduleExpression?: string
  ) {
    if (!props) throw `EventRule props undefined for ${id}`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification to lambda function target',
      eventBusName: eventBusName,
      eventPattern: eventPattern,
      name: `${props.name}-${scope.props.stage}`,
      scheduleExpression: scheduleExpression,
      state: props.state,
      targets: [
        {
          arn: lambdaFunction.functionArn,
          id: `${id}-${scope.props.stage}`,
          input: props.input ?? undefined,
        },
      ],
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param cluster
   * @param task
   * @param subnetIds
   * @param role
   * @param eventPattern
   */
  public createFargateTaskRule(
    id: string,
    scope: CommonConstruct,
    props: RuleProps,
    cluster: ecs.ICluster,
    task: ecs.ITaskDefinition,
    subnetIds: string[],
    role: iam.Role | iam.CfnRole,
    eventPattern?: any
  ) {
    if (!props) throw `EventRule props undefined for ${id}`

    const eventRule = new events.CfnRule(scope, `${id}`, {
      description: 'Rule to send notification on new objects in data bucket to ecs task target',
      eventPattern: eventPattern,
      name: `${props.name}-${scope.props.stage}`,
      state: props.state,
      targets: [
        {
          arn: cluster.clusterArn,
          ecsParameters: {
            launchType: 'FARGATE',
            networkConfiguration: {
              awsVpcConfiguration: { assignPublicIp: 'ENABLED', subnets: subnetIds },
            },
            taskCount: 1,
            taskDefinitionArn: task.taskDefinitionArn,
          },
          id: `${id}-${scope.props.stage}`,
          roleArn: role instanceof iam.Role ? role.roleArn : role.attrArn,
        },
      ],
    })

    utils.createCfnOutput(`${id}-ruleArn`, scope, eventRule.attrArn)
    utils.createCfnOutput(`${id}-ruleName`, scope, eventRule.name)

    return eventRule
  }

  /**
   * @summary Method to create an eventbridge pipe with sqs queue as source and step function as target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the props for the pipe
   * @param sourceQueue the source sqs queue
   * @param targetStepFunction the target step function
   */
  public createSqsToSfnCfnPipe(
    id: string,
    scope: CommonConstruct,
    props: SqsToSfnPipeProps,
    sourceQueue: sqs.IQueue,
    targetStepFunction: sfn.IStateMachine
  ) {
    const pipeRole = scope.iamManager.createRoleForSqsToSfnPipe(
      `${id}-role`,
      scope,
      sourceQueue.queueArn,
      targetStepFunction.stateMachineArn
    )

    const pipe = new pipes.CfnPipe(scope, `${id}`, {
      ...props,
      description: props.description,
      enrichment: props.enrichment,
      enrichmentParameters: props.enrichmentParameters,
      name: `${props.name}-${scope.props.stage}`,
      roleArn: pipeRole.roleArn,
      source: sourceQueue.queueArn,
      sourceParameters: {
        filterCriteria: props.pipeFilterPattern
          ? {
              filters: [
                {
                  pattern: JSON.stringify(props.pipeFilterPattern),
                },
              ],
            }
          : undefined,
        sqsQueueParameters: {
          batchSize: props.sqsBatchSize,
          maximumBatchingWindowInSeconds: props.sqsMaximumBatchingWindowInSeconds,
        },
      },
      target: targetStepFunction.stateMachineArn,
      targetParameters: {
        inputTemplate: props.sfnInputTemplate,
        stepFunctionStateMachineParameters: {
          invocationType: props.sfnInvocationType ?? 'FIRE_AND_FORGET',
        },
      },
    })

    utils.createCfnOutput(`${id}-pipeArn`, scope, pipe.attrArn)
    utils.createCfnOutput(`${id}-pipeName`, scope, pipe.name)

    return pipe
  }
}
