import { Duration } from 'aws-cdk-lib'
import { IRestApi } from 'aws-cdk-lib/aws-apigateway'
import { ITable } from 'aws-cdk-lib/aws-dynamodb'
import { IRole } from 'aws-cdk-lib/aws-iam'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { ILogGroup } from 'aws-cdk-lib/aws-logs'
import { IQueue } from 'aws-cdk-lib/aws-sqs'
import {
  Choice,
  DefinitionBody,
  Fail,
  IChainable,
  IStateMachine,
  LogLevel,
  Map,
  Parallel,
  Pass,
  StateMachine,
  Succeed,
  Wait,
  WaitTime,
} from 'aws-cdk-lib/aws-stepfunctions'
import {
  CallApiGatewayRestApiEndpoint,
  DynamoAttributeValue,
  DynamoDeleteItem,
  DynamoGetItem,
  DynamoPutItem,
  LambdaInvoke,
  SqsSendMessage,
  StepFunctionsStartExecution,
} from 'aws-cdk-lib/aws-stepfunctions-tasks'
import _ from 'lodash'
import { v4 as uuidv4 } from 'uuid'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import {
  SfnCallApiGatewayRestApiEndpointProps,
  SfnChoiceProps,
  SfnDynamoDeleteItemProps,
  SfnDynamoGetItemProps,
  SfnDynamoPutItemProps,
  SfnFailProps,
  SfnLambdaInvokeProps,
  SfnMapProps,
  SfnParallelProps,
  SfnPassProps,
  SfnSqsSendMessageProps,
  SfnStartExecutionProps,
  SfnStateMachineProps,
  SfnSucceedProps,
  SfnWaitProps,
} from './types'

const DEFAULT_RETRY_CONFIG = [
  {
    backoffRate: 2,
    errors: ['States.ALL'],
    intervalInSecs: 30,
    maxAttempts: 6,
  },
]

/**
 * @classdesc Provides operations on AWS Step Functions Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.sfnManager.createSuccessStep('MyStep', this, myStepProps)
 *   }
 * }
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
export class SfnManager {
  /**
   * @summary Method to create a success step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createSuccessStep(id: string, scope: CommonConstruct, props: SfnSucceedProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new Succeed(scope, `${props.name}`, {
      ...props,
      comment: `Succeed step for ${props.name} - ${scope.props.stage} stage`,
    })
  }

  /**
   * @summary Method to create a failure step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createFailStep(id: string, scope: CommonConstruct, props: SfnFailProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new Fail(scope, `${props.name}`, {
      ...props,
      comment: `Fail step for ${props.name} - ${scope.props.stage} stage`,
    })
  }

  /**
   * @summary Method to create a pass step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createPassStep(id: string, scope: CommonConstruct, props: SfnPassProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new Pass(scope, `${props.name}`, {
      ...props,
      comment: `Pass step for ${props.name} - ${scope.props.stage} stage`,
    })
  }

  /**
   * @summary Method to create a parallel step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createParallelStep(id: string, scope: CommonConstruct, props: SfnParallelProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new Parallel(scope, `${props.name}`, {
      ...props,
      comment: `Parallel step for ${props.name} - ${scope.props.stage} stage`,
    })
  }

  /**
   * @summary Method to create a choice step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createChoiceStep(id: string, scope: CommonConstruct, props: SfnChoiceProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new Choice(scope, `${props.name}`, {
      ...props,
      comment: `Choice step for ${props.name} - ${scope.props.stage} stage`,
    })
  }

  /**
   * @summary Method to create a wait step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createWaitStep(id: string, scope: CommonConstruct, props: SfnWaitProps) {
    return new Wait(scope, `${props.name}`, {
      ...props,
      comment: `Choice step for ${props.name} - ${scope.props.stage} stage`,
      time: WaitTime.duration(Duration.seconds(props.delayInSeconds)),
    })
  }

  /**
   * @summary Method to create a DynamoDB get item step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param table The table to get the item from
   * @param tableKey The table key for query/scan
   */
  public createDynamoDbGetItemStep(
    id: string,
    scope: CommonConstruct,
    props: SfnDynamoGetItemProps,
    table: ITable,
    tableKey: { [key: string]: DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new DynamoGetItem(scope, `${props.name}`, {
      ...props,
      comment: `DynamoDB GetItem step for ${props.name} - ${scope.props.stage} stage`,
      key: tableKey,
      table,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval,
      })
    })

    return step
  }

  /**
   * @summary Method to create a DynamoDB put item step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param table The table to put the item in
   * @param tableItem The item to add to the table
   */
  public createDynamoDbPutItemStep(
    id: string,
    scope: CommonConstruct,
    props: SfnDynamoPutItemProps,
    table: ITable,
    tableItem: { [key: string]: DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new DynamoPutItem(scope, `${props.name}`, {
      ...props,
      comment: `DynamoDB PutItem step for ${props.name} - ${scope.props.stage} stage`,
      item: tableItem,
      table,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    })

    return step
  }

  /**
   * @summary Method to create a DynamoDB delete item step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param table The table to put the item in
   * @param tableKey The table key for query/scan
   */
  public createDynamoDbDeleteItemStep(
    id: string,
    scope: CommonConstruct,
    props: SfnDynamoDeleteItemProps,
    table: ITable,
    tableKey: { [key: string]: DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new DynamoDeleteItem(scope, `${props.name}`, {
      ...props,
      comment: `DynamoDB DeleteItem step for ${props.name} - ${scope.props.stage} stage`,
      key: tableKey,
      table,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    })

    return step
  }

  /**
   * @summary Method to send a message to SQS step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param queue The queue to send the message to
   */
  public createSendSqsMessageStep(id: string, scope: CommonConstruct, props: SfnSqsSendMessageProps, queue: IQueue) {
    if (!props) throw `Step props undefined for ${id}`
    if (!props.messageBody) throw 'Message body undefined'
    const step = new SqsSendMessage(scope, `${props.name}`, {
      ...props,
      comment: `DynamoDB PutItem step for ${props.name} - ${scope.props.stage} stage`,
      queue,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval,
      })
    })

    return step
  }

  /**
   * @summary Method to create a lambda invoke step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param lambdaFunction
   */
  public createLambdaStep(id: string, scope: CommonConstruct, props: SfnLambdaInvokeProps, lambdaFunction: IFunction) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new LambdaInvoke(scope, `${props.name}`, {
      ...props,
      comment: `Lambda step for ${props.name} - ${scope.props.stage} stage`,
      lambdaFunction,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval,
      })
    })

    return step
  }

  /**
   * @summary Method to create a lambda invoke step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param lambdaFunction
   * @param skipExecution
   */
  public createSkippableLambdaStep(
    id: string,
    scope: CommonConstruct,
    props: SfnLambdaInvokeProps,
    lambdaFunction: IFunction,
    skipExecution?: boolean
  ) {
    if (!props) throw `Step props undefined for ${id}`
    if (skipExecution) return this.createPassStep(id, scope, { comment: props.comment, name: props.name })
    const step = new LambdaInvoke(scope, `${props.name}`, {
      ...props,
      comment: `Lambda step for ${props.name} - ${scope.props.stage} stage`,
      lambdaFunction,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval,
      })
    })

    return step
  }

  /**
   * @summary Method to create a API Gateway invoke step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param api
   */
  public createApiStep(
    id: string,
    scope: CommonConstruct,
    props: SfnCallApiGatewayRestApiEndpointProps,
    api: IRestApi
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new CallApiGatewayRestApiEndpoint(scope, `${props.name}`, {
      ...props,
      api,
      comment: `API step for ${props.name} - ${scope.props.stage} stage`,
      stageName: scope.props.stage,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval,
      })
    })

    return step
  }

  /**
   * @summary Method to create a step function execution step
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props props for the step
   * @param stateMachine the state machine to execute
   */
  public createSfnExecutionStep(
    id: string,
    scope: CommonConstruct,
    props: SfnStartExecutionProps,
    stateMachine: IStateMachine
  ) {
    const step = new StepFunctionsStartExecution(scope, `${id}`, {
      ...props,
      associateWithParent: props.associateWithParent ?? true,
      name: props.name ?? uuidv4(),
      stateMachine,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    _.forEach(retries, retry => {
      step.addRetry({
        ...retry,
        interval: retry.intervalInSecs ? Duration.seconds(retry.intervalInSecs) : retry.interval,
      })
    })

    return step
  }

  /**
   * @summary Method to create a step function map state
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props props for the map state
   */
  public createMapState(id: string, scope: CommonConstruct, props: SfnMapProps) {
    return new Map(scope, `${id}`, props)
  }

  /**
   * @summary Method to create a state machine
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param definition
   * @param logGroup
   * @param role
   */
  public createStateMachine(
    id: string,
    scope: CommonConstruct,
    props: SfnStateMachineProps,
    definition: IChainable,
    logGroup: ILogGroup,
    role?: IRole
  ) {
    if (!props) throw `State Machine props undefined for ${id}`
    if (!props.stateMachineName) throw `State Machine stateMachineName undefined for ${id}`

    const stateMachine = new StateMachine(scope, `${id}`, {
      ...props,
      definitionBody: DefinitionBody.fromChainable(definition),
      logs: {
        destination: logGroup,
        includeExecutionData: props.logs?.includeExecutionData ?? true,
        level: props.logs?.level ?? LogLevel.ALL,
      },
      role,
      stateMachineName: scope.resourceNameFormatter.format(
        props.stateMachineName,
        scope.props.resourceNameOptions?.stepFunction
      ),
    })

    createCfnOutput(`${id}-stateMachineName`, scope, stateMachine.stateMachineName)
    createCfnOutput(`${id}-stateMachineArn`, scope, stateMachine.stateMachineArn)

    return stateMachine
  }
}
