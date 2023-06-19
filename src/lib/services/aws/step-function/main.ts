import * as cdk from 'aws-cdk-lib'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as utils from '../../../utils'
import { v4 as uuidv4 } from 'uuid'
import { CommonConstruct } from '../../../common'
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
    errors: ['States.ALL'],
    intervalInSecs: 30,
    maxAttempts: 6,
    backoffRate: 2,
  },
]

/**
 * @stability stable
 * @category cdk-utils.step-functions-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Step Functions Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.sfnManager.createSuccessStep('MyStep', this, myStepProps)
 *   }
 * }
 *
 * @see [CDK Step Functions Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_stepfunctions-readme.html}
 */
export class SfnManager {
  /**
   * @summary Method to create a success step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnSucceedProps} props
   */
  public createSuccessStep(id: string, scope: CommonConstruct, props: SfnSucceedProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new sfn.Succeed(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Succeed step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a failure step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnFailProps} props
   */
  public createFailStep(id: string, scope: CommonConstruct, props: SfnFailProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new sfn.Fail(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Fail step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a pass step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnPassProps} props
   */
  public createPassStep(id: string, scope: CommonConstruct, props: SfnPassProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new sfn.Pass(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Pass step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a parallel step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnParallelProps} props
   */
  public createParallelStep(id: string, scope: CommonConstruct, props: SfnParallelProps) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new sfn.Parallel(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Parallel step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to create a choice step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnChoiceProps} props
   */
  public createChoiceStep(id: string, scope: CommonConstruct, props: SfnChoiceProps) {
    if (!props) throw `Step props undefined for ${id}`
    return new sfn.Choice(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Choice step for ${props.name} - ${scope.props.stage} stage`,
      },
    })
  }

  /**
   * @summary Method to create a wait step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnWaitProps} props
   */
  public createWaitStep(id: string, scope: CommonConstruct, props: SfnWaitProps) {
    return new sfn.Wait(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Choice step for ${props.name} - ${scope.props.stage} stage`,
        time: sfn.WaitTime.duration(cdk.Duration.seconds(props.delayInSeconds)),
      },
    })
  }

  /**
   * @summary Method to create a DynamoDB get item step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnDynamoGetItemProps} props
   * @param {dynamodb.ITable} table The table to get the item from
   * @param tableKey The table key for query/scan
   */
  public createDynamoDbGetItemStep(
    id: string,
    scope: CommonConstruct,
    props: SfnDynamoGetItemProps,
    table: dynamodb.ITable,
    tableKey: { [key: string]: tasks.DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.DynamoGetItem(scope, `${props.name}`, {
      ...props,
      ...{
        table: table,
        key: tableKey,
        consistentRead: props.consistentRead,
        inputPath: props.inputPath,
        outputPath: props.outputPath,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        taskTimeout: props.taskTimeout,
        heartbeatTimeout: props.heartbeatTimeout,
        integrationPattern: props.integrationPattern,
        expressionAttributeNames: props.expressionAttributeNames,
        projectionExpression: props.projectionExpression,
        returnConsumedCapacity: props.returnConsumedCapacity,
        comment: `DynamoDB GetItem step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to create a DynamoDB put item step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnDynamoPutItemProps} props
   * @param {dynamodb.ITable} table The table to put the item in
   * @param tableItem The item to add to the table
   */
  public createDynamoDbPutItemStep(
    id: string,
    scope: CommonConstruct,
    props: SfnDynamoPutItemProps,
    table: dynamodb.ITable,
    tableItem: { [key: string]: tasks.DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.DynamoPutItem(scope, `${props.name}`, {
      ...props,
      ...{
        table: table,
        item: tableItem,
        inputPath: props.inputPath,
        outputPath: props.outputPath,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        taskTimeout: props.taskTimeout,
        heartbeatTimeout: props.heartbeatTimeout,
        integrationPattern: props.integrationPattern,
        conditionExpression: props.conditionExpression,
        expressionAttributeNames: props.expressionAttributeNames,
        expressionAttributeValues: props.expressionAttributeValues,
        returnConsumedCapacity: props.returnConsumedCapacity,
        returnItemCollectionMetrics: props.returnItemCollectionMetrics,
        returnValues: props.returnValues,
        comment: `DynamoDB PutItem step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to create a DynamoDB delete item step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnDynamoDeleteItemProps} props
   * @param {dynamodb.ITable} table The table to put the item in
   * @param tableKey The table key for query/scan
   */
  public createDynamoDbDeleteItemStep(
    id: string,
    scope: CommonConstruct,
    props: SfnDynamoDeleteItemProps,
    table: dynamodb.ITable,
    tableKey: { [key: string]: tasks.DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.DynamoDeleteItem(scope, `${props.name}`, {
      ...props,
      ...{
        table: table,
        key: tableKey,
        conditionExpression: props.conditionExpression,
        expressionAttributeNames: props.expressionAttributeNames,
        expressionAttributeValues: props.expressionAttributeValues,
        taskTimeout: props.taskTimeout,
        heartbeatTimeout: props.heartbeatTimeout,
        inputPath: props.inputPath,
        outputPath: props.outputPath,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        integrationPattern: props.integrationPattern,
        returnConsumedCapacity: props.returnConsumedCapacity,
        returnItemCollectionMetrics: props.returnItemCollectionMetrics,
        returnValues: props.returnValues,
        comment: `DynamoDB DeleteItem step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to send a message to SQS step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnSqsSendMessageProps} props
   * @param {sqs.IQueue} queue The queue to send the message to
   */
  public createSendSqsMessageStep(
    id: string,
    scope: CommonConstruct,
    props: SfnSqsSendMessageProps,
    queue: sqs.IQueue
  ) {
    if (!props) throw `Step props undefined for ${id}`
    if (!props.messageBody) throw 'Message body undefined'
    const step = new tasks.SqsSendMessage(scope, `${props.name}`, {
      ...props,
      ...{
        queue: queue,
        messageBody: props.messageBody,
        messageGroupId: props.messageGroupId,
        messageDeduplicationId: props.messageDeduplicationId,
        delay: props.delay,
        inputPath: props.inputPath,
        outputPath: props.outputPath,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        taskTimeout: props.taskTimeout,
        heartbeatTimeout: props.heartbeatTimeout,
        integrationPattern: props.integrationPattern,
        comment: `DynamoDB PutItem step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to create a lambda invoke step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnLambdaInvokeProps} props
   * @param {lambda.IFunction} lambdaFunction
   */
  public createLambdaStep(
    id: string,
    scope: CommonConstruct,
    props: SfnLambdaInvokeProps,
    lambdaFunction: lambda.IFunction
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.LambdaInvoke(scope, `${props.name}`, {
      ...props,
      ...{
        lambdaFunction,
        comment: `Lambda step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to create a API Gateway invoke step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnLambdaInvokeProps} props
   * @param {apig.IRestApi} api
   */
  public createApiStep(
    id: string,
    scope: CommonConstruct,
    props: SfnCallApiGatewayRestApiEndpointProps,
    api: apig.IRestApi
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.CallApiGatewayRestApiEndpoint(scope, `${props.name}`, {
      ...props,
      ...{
        api,
        stageName: scope.props.stage,
        comment: `API step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to create a step function execution step
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnStartExecutionProps} props props for the step
   * @param {sfn.IStateMachine} stateMachine the state machine to execute
   */
  public createSfnExecutionStep(
    id: string,
    scope: CommonConstruct,
    props: SfnStartExecutionProps,
    stateMachine: sfn.IStateMachine
  ) {
    const step = new tasks.StepFunctionsStartExecution(scope, `${id}`, {
      ...props,
      associateWithParent: props.associateWithParent ?? true,
      inputPath: props.inputPath,
      name: props.name ?? uuidv4(),
      stateMachine: stateMachine,
    })

    let retries = props.retries
    if (!retries || retries.length === 0) {
      retries = DEFAULT_RETRY_CONFIG
    }

    retries.forEach(retry =>
      step.addRetry({
        ...retry,
        ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
      })
    )

    return step
  }

  /**
   * @summary Method to create a step function map state
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnMapProps} props props for the map state
   */
  public createMapState(id: string, scope: CommonConstruct, props: SfnMapProps) {
    return new sfn.Map(scope, `${id}`, props)
  }

  /**
   * @summary Method to create a state machine
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SfnStateMachineProps} props
   * @param {sfn.IChainable} definition
   * @param {logs.ILogGroup} logGroup
   * @param {iam.IRole} role
   */
  public createStateMachine(
    id: string,
    scope: CommonConstruct,
    props: SfnStateMachineProps,
    definition: sfn.IChainable,
    logGroup: logs.ILogGroup,
    role?: iam.IRole
  ) {
    if (!props) throw `State Machine props undefined for ${id}`
    const stateMachine = new sfn.StateMachine(scope, `${id}`, {
      stateMachineName: `${props.stateMachineName}-${scope.props.stage}`,
      definition,
      role,
      stateMachineType: props.stateMachineType,
      logs: {
        destination: logGroup,
        includeExecutionData: props.logs?.includeExecutionData ?? true,
        level: props.logs?.level ?? sfn.LogLevel.ALL,
      },
      tracingEnabled: props.tracingEnabled,
      timeout: props.timeout,
    })

    utils.createCfnOutput(`${id}-stateMachineName`, scope, stateMachine.stateMachineName)
    utils.createCfnOutput(`${id}-stateMachineArn`, scope, stateMachine.stateMachineArn)

    return stateMachine
  }
}
