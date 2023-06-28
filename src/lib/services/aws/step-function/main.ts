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
import { DefinitionBody } from 'aws-cdk-lib/aws-stepfunctions'

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
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
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
    return new sfn.Succeed(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Succeed step for ${props.name} - ${scope.props.stage} stage`,
      },
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
    return new sfn.Fail(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Fail step for ${props.name} - ${scope.props.stage} stage`,
      },
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
    return new sfn.Pass(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Pass step for ${props.name} - ${scope.props.stage} stage`,
      },
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
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
    table: dynamodb.ITable,
    tableKey: { [key: string]: tasks.DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.DynamoGetItem(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `DynamoDB GetItem step for ${props.name} - ${scope.props.stage} stage`,
        consistentRead: props.consistentRead,
        expressionAttributeNames: props.expressionAttributeNames,
        heartbeatTimeout: props.heartbeatTimeout,
        inputPath: props.inputPath,
        integrationPattern: props.integrationPattern,
        key: tableKey,
        outputPath: props.outputPath,
        projectionExpression: props.projectionExpression,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        returnConsumedCapacity: props.returnConsumedCapacity,
        table: table,
        taskTimeout: props.taskTimeout,
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
    table: dynamodb.ITable,
    tableItem: { [key: string]: tasks.DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.DynamoPutItem(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `DynamoDB PutItem step for ${props.name} - ${scope.props.stage} stage`,
        conditionExpression: props.conditionExpression,
        expressionAttributeNames: props.expressionAttributeNames,
        expressionAttributeValues: props.expressionAttributeValues,
        heartbeatTimeout: props.heartbeatTimeout,
        inputPath: props.inputPath,
        integrationPattern: props.integrationPattern,
        item: tableItem,
        outputPath: props.outputPath,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        returnConsumedCapacity: props.returnConsumedCapacity,
        returnItemCollectionMetrics: props.returnItemCollectionMetrics,
        returnValues: props.returnValues,
        table: table,
        taskTimeout: props.taskTimeout,
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
    table: dynamodb.ITable,
    tableKey: { [key: string]: tasks.DynamoAttributeValue }
  ) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new tasks.DynamoDeleteItem(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `DynamoDB DeleteItem step for ${props.name} - ${scope.props.stage} stage`,
        conditionExpression: props.conditionExpression,
        expressionAttributeNames: props.expressionAttributeNames,
        expressionAttributeValues: props.expressionAttributeValues,
        heartbeatTimeout: props.heartbeatTimeout,
        inputPath: props.inputPath,
        integrationPattern: props.integrationPattern,
        key: tableKey,
        outputPath: props.outputPath,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        returnConsumedCapacity: props.returnConsumedCapacity,
        returnItemCollectionMetrics: props.returnItemCollectionMetrics,
        returnValues: props.returnValues,
        table: table,
        taskTimeout: props.taskTimeout,
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param queue The queue to send the message to
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
        comment: `DynamoDB PutItem step for ${props.name} - ${scope.props.stage} stage`,
        delay: props.delay,
        heartbeatTimeout: props.heartbeatTimeout,
        inputPath: props.inputPath,
        integrationPattern: props.integrationPattern,
        messageBody: props.messageBody,
        messageDeduplicationId: props.messageDeduplicationId,
        messageGroupId: props.messageGroupId,
        outputPath: props.outputPath,
        queue: queue,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        taskTimeout: props.taskTimeout,
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param lambdaFunction
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
        comment: `Lambda step for ${props.name} - ${scope.props.stage} stage`,
        lambdaFunction,
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
    lambdaFunction: lambda.IFunction,
    skipExecution?: boolean
  ) {
    if (!props) throw `Step props undefined for ${id}`
    if (skipExecution) return this.createPassStep(id, scope, { name: props.name, comment: props.comment })
    const step = new tasks.LambdaInvoke(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Lambda step for ${props.name} - ${scope.props.stage} stage`,
        lambdaFunction,
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param api
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
        comment: `API step for ${props.name} - ${scope.props.stage} stage`,
        stageName: scope.props.stage,
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props props for the step
   * @param stateMachine the state machine to execute
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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props props for the map state
   */
  public createMapState(id: string, scope: CommonConstruct, props: SfnMapProps) {
    return new sfn.Map(scope, `${id}`, props)
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
    definition: sfn.IChainable,
    logGroup: logs.ILogGroup,
    role?: iam.IRole
  ) {
    if (!props) throw `State Machine props undefined for ${id}`
    const stateMachine = new sfn.StateMachine(scope, `${id}`, {
      definitionBody: DefinitionBody.fromChainable(definition),
      logs: {
        destination: logGroup,
        includeExecutionData: props.logs?.includeExecutionData ?? true,
        level: props.logs?.level ?? sfn.LogLevel.ALL,
      },
      role,
      stateMachineName: `${props.stateMachineName}-${scope.props.stage}`,
      stateMachineType: props.stateMachineType,
      timeout: props.timeout,
      tracingEnabled: props.tracingEnabled,
    })

    utils.createCfnOutput(`${id}-stateMachineName`, scope, stateMachine.stateMachineName)
    utils.createCfnOutput(`${id}-stateMachineArn`, scope, stateMachine.stateMachineArn)

    return stateMachine
  }
}
