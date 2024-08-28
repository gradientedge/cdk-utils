import { Tags } from 'aws-cdk-lib'
import { ICluster, ITaskDefinition } from 'aws-cdk-lib/aws-ecs'
import { CfnRule, EventBus, IEventBus, IRuleTarget, Rule } from 'aws-cdk-lib/aws-events'
import { CfnRole, Role } from 'aws-cdk-lib/aws-iam'
import { CfnPermission, IFunction } from 'aws-cdk-lib/aws-lambda'
import { CfnPipe } from 'aws-cdk-lib/aws-pipes'
import { IQueue } from 'aws-cdk-lib/aws-sqs'
import { IStateMachine } from 'aws-cdk-lib/aws-stepfunctions'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import {
  DynamoDbToLambdaPipeProps,
  EventBusProps,
  EventRuleProps,
  RuleProps,
  SqsToLambdaPipeProps,
  SqsToSfnPipeProps,
} from './types'

/**
 * @classdesc Provides operations on AWS EventBridge.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
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
    if (!props.eventBusName) throw `EventBus eventBusName undefined for ${id}`

    let eventBusName = props.eventBusName
    if (eventBusName && eventBusName != 'default') {
      eventBusName = scope.resourceNameFormatter(props.eventBusName, props.resourceNameOptions)
    }
    const eventBus = new EventBus(scope, `${id}`, {
      ...props,
      eventBusName,
    })

    createCfnOutput(`${id}-eventBusName`, scope, `${props.eventBusName}-${scope.props.stage}`)
    createCfnOutput(`${id}-eventBusArn`, scope, eventBus.eventBusArn)

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
    eventBus?: IEventBus,
    targets?: IRuleTarget[]
  ) {
    if (!props) throw `EventRule props undefined for ${id}`
    if (!props.ruleName) throw `EventRule ruleName undefined for ${id}`

    const rule = new Rule(scope, `${id}`, {
      ...props,
      eventBus,
      ruleName: scope.resourceNameFormatter(props.ruleName, props.resourceNameOptions),
    })

    if (targets && !_.isEmpty(targets)) {
      _.forEach(targets, target => {
        rule.addTarget(target)
      })
    }

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(rule).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-ruleArn`, scope, rule.ruleArn)
    createCfnOutput(`${id}-ruleName`, scope, rule.ruleName)

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
    lambdaFunction: IFunction,
    eventBusName?: string,
    eventPattern?: any,
    scheduleExpression?: string
  ) {
    if (!props) throw `EventRule props undefined for ${id}`
    if (!props.name) throw `EventRule name undefined for ${id}`

    const eventRule = new CfnRule(scope, `${id}`, {
      ...props,
      description: 'Rule to send notification to lambda function target',
      eventBusName,
      eventPattern,
      name: scope.resourceNameFormatter(props.name, props.resourceNameOptions),
      scheduleExpression,
      targets: [
        {
          arn: lambdaFunction.functionArn,
          id: scope.resourceNameFormatter(props.name, props.resourceNameOptions),
          input: props.input ?? undefined,
        },
      ],
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(eventRule).add(tag.key, tag.value)
      })
    }

    new CfnPermission(scope, `${id}LambdaPermission`, {
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.functionName,
      principal: 'events.amazonaws.com',
      sourceArn: eventRule.attrArn,
    })

    createCfnOutput(`${id}-ruleArn`, scope, eventRule.attrArn)
    createCfnOutput(`${id}-ruleName`, scope, eventRule.name)

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
    cluster: ICluster,
    task: ITaskDefinition,
    subnetIds: string[],
    role: Role | CfnRole,
    eventPattern?: any
  ) {
    if (!props) throw `EventRule props undefined for ${id}`
    if (!props.name) throw `EventRule name undefined for ${id}`

    const eventRule = new CfnRule(scope, `${id}`, {
      ...props,
      description: 'Rule to send notification on new objects in data bucket to ecs task target',
      eventPattern,
      name: scope.resourceNameFormatter(props.name, props.resourceNameOptions),
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
          id: scope.resourceNameFormatter(props.name, props.resourceNameOptions),
          roleArn: role instanceof Role ? role.roleArn : role.attrArn,
        },
      ],
    })

    createCfnOutput(`${id}-ruleArn`, scope, eventRule.attrArn)
    createCfnOutput(`${id}-ruleName`, scope, eventRule.name)

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
    sourceQueue: IQueue,
    targetStepFunction: IStateMachine
  ) {
    if (!props) throw `Pipe props undefined for ${id}`
    if (!props.name) throw `Pipe name undefined for ${id}`

    const pipeRole = scope.iamManager.createRoleForSqsToSfnPipe(
      `${id}-role`,
      scope,
      sourceQueue.queueArn,
      targetStepFunction.stateMachineArn
    )

    const pipe = new CfnPipe(scope, `${id}`, {
      ...props,
      name: scope.resourceNameFormatter(props.name, props.resourceNameOptions),
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

    createCfnOutput(`${id}-pipeArn`, scope, pipe.attrArn)
    createCfnOutput(`${id}-pipeName`, scope, pipe.name)

    return pipe
  }

  /**
   * @summary Method to create an eventbridge pipe with sqs queue as source and lambda function as target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the props for the pipe
   * @param sourceQueue the source sqs queue
   * @param targetLambdaFunction the target lambda function
   */
  public createSqsToLambdaCfnPipe(
    id: string,
    scope: CommonConstruct,
    props: SqsToLambdaPipeProps,
    sourceQueue: IQueue,
    targetLambdaFunction: IFunction
  ) {
    if (!props) throw `Pipe props undefined for ${id}`
    if (!props.name) throw `Pipe name undefined for ${id}`

    const pipeRole = scope.iamManager.createRoleForSqsToLambdaPipe(
      `${id}-role`,
      scope,
      sourceQueue.queueArn,
      targetLambdaFunction.functionArn
    )

    const pipe = new CfnPipe(scope, `${id}`, {
      ...props,
      name: scope.resourceNameFormatter(props.name, props.resourceNameOptions),
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
      target: targetLambdaFunction.functionArn,
      targetParameters: {
        inputTemplate: props.lambdaInputTemplate,
      },
    })

    createCfnOutput(`${id}-pipeArn`, scope, pipe.attrArn)
    createCfnOutput(`${id}-pipeName`, scope, pipe.name)

    return pipe
  }

  /**
   * @summary Method to create an eventbridge pipe with DynamoDb stream as source and lambda function as target
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the props for the pipe
   * @param dynamoDbStream the source dynamoDb stream
   * @param targetLambdaFunction the target lambda function
   */
  public createDynamoDbToLambdaCfnPipe(
    id: string,
    scope: CommonConstruct,
    props: DynamoDbToLambdaPipeProps,
    sourceDynamoDbStreamArn: string,
    targetLambdaFunction: IFunction
  ) {
    if (!props) throw `Pipe props undefined for ${id}`
    if (!props.name) throw `Pipe name undefined for ${id}`

    const pipeRole = scope.iamManager.createRoleForDynamoDbToLambdaPipe(
      `${id}-role`,
      scope,
      sourceDynamoDbStreamArn,
      targetLambdaFunction.functionArn
    )

    const pipe = new CfnPipe(scope, `${id}`, {
      ...props,
      name: scope.resourceNameFormatter(props.name, props.resourceNameOptions),
      roleArn: pipeRole.roleArn,
      source: sourceDynamoDbStreamArn,
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
        dynamoDbStreamParameters: {
          startingPosition: props.dynamoDbStartingPosition,
          batchSize: props.dynamoDbBatchSize,
        },
      },
      target: targetLambdaFunction.functionArn,
    })

    createCfnOutput(`${id}-pipeArn`, scope, pipe.attrArn)
    createCfnOutput(`${id}-pipeName`, scope, pipe.name)

    return pipe
  }
}
