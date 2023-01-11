import * as cdk from 'aws-cdk-lib'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.step-functions-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Step Functions Service.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnSucceedProps} props
   */
  public createSuccessStep(id: string, scope: common.CommonConstruct, props: types.SfnSucceedProps) {
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnFailProps} props
   */
  public createFailStep(id: string, scope: common.CommonConstruct, props: types.SfnFailProps) {
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnPassProps} props
   */
  public createPassStep(id: string, scope: common.CommonConstruct, props: types.SfnPassProps) {
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnParallelProps} props
   */
  public createParallelStep(id: string, scope: common.CommonConstruct, props: types.SfnParallelProps) {
    if (!props) throw `Step props undefined for ${id}`
    const step = new sfn.Parallel(scope, `${props.name}`, {
      ...props,
      ...{
        comment: `Parallel step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    if (props.retries && props.retries.length > 0) {
      props.retries.forEach(retry =>
        step.addRetry({
          ...retry,
          ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
        })
      )
    }

    return step
  }

  /**
   * @summary Method to create a choice step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnChoiceProps} props
   */
  public createChoiceStep(id: string, scope: common.CommonConstruct, props: types.SfnChoiceProps) {
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnWaitProps} props
   */
  public createWaitStep(id: string, scope: common.CommonConstruct, props: types.SfnWaitProps) {
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnDynamoGetItemProps} props
   * @param {dynamodb.ITable} table The table to get the item from
   * @param tableKey The table key for query/scan
   */
  public createDynamoDbGetItemStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnDynamoGetItemProps,
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
        timeout: props.timeout,
        heartbeat: props.heartbeat,
        integrationPattern: props.integrationPattern,
        expressionAttributeNames: props.expressionAttributeNames,
        projectionExpression: props.projectionExpression,
        returnConsumedCapacity: props.returnConsumedCapacity,
        comment: `DynamoDB GetItem step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    if (props.retries && props.retries.length > 0) {
      props.retries.forEach(retry =>
        step.addRetry({
          ...retry,
          ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
        })
      )
    }

    return step
  }

  /**
   * @summary Method to create a DynamoDB put item step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnDynamoPutItemProps} props
   * @param {dynamodb.ITable} table The table to put the item in
   * @param tableItem The item to add to the table
   */
  public createDynamoDbPutItemStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnDynamoPutItemProps,
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
        timeout: props.timeout,
        heartbeat: props.heartbeat,
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

    if (props.retries && props.retries.length > 0) {
      props.retries.forEach(retry =>
        step.addRetry({
          ...retry,
          ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
        })
      )
    }

    return step
  }

  /**
   * @summary Method to create a DynamoDB delete item step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnDynamoDeleteItemProps} props
   * @param {dynamodb.ITable} table The table to put the item in
   * @param tableKey The table key for query/scan
   */
  public createDynamoDbDeleteItemStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnDynamoDeleteItemProps,
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
        heartbeat: props.heartbeat,
        inputPath: props.inputPath,
        outputPath: props.outputPath,
        resultPath: props.resultPath,
        resultSelector: props.resultSelector,
        timeout: props.timeout,
        integrationPattern: props.integrationPattern,
        returnConsumedCapacity: props.returnConsumedCapacity,
        returnItemCollectionMetrics: props.returnItemCollectionMetrics,
        returnValues: props.returnValues,
        comment: `DynamoDB DeleteItem step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    if (props.retries && props.retries.length > 0) {
      props.retries.forEach(retry =>
        step.addRetry({
          ...retry,
          ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
        })
      )
    }

    return step
  }

  /**
   * @summary Method to send a message to SQS step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnSqsSendMessageProps} props
   * @param {sqs.IQueue} queue The queue to send the message to
   */
  public createSendSqsMessageStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnSqsSendMessageProps,
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
        timeout: props.timeout,
        heartbeat: props.heartbeat,
        integrationPattern: props.integrationPattern,
        comment: `DynamoDB PutItem step for ${props.name} - ${scope.props.stage} stage`,
      },
    })

    if (props.retries && props.retries.length > 0) {
      props.retries.forEach(retry =>
        step.addRetry({
          ...retry,
          ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
        })
      )
    }

    return step
  }

  /**
   * @summary Method to create a lambda invoke step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnLambdaInvokeProps} props
   * @param {lambda.IFunction} lambdaFunction
   */
  public createLambdaStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnLambdaInvokeProps,
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

    if (props.retries && props.retries.length > 0) {
      props.retries.forEach(retry =>
        step.addRetry({
          ...retry,
          ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
        })
      )
    }

    return step
  }

  /**
   * @summary Method to create a API Gateway invoke step
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnLambdaInvokeProps} props
   * @param {apig.IRestApi} api
   */
  public createApiStep(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnCallApiGatewayRestApiEndpointProps,
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

    if (props.retries && props.retries.length > 0) {
      props.retries.forEach(retry =>
        step.addRetry({
          ...retry,
          ...{ interval: retry.intervalInSecs ? cdk.Duration.seconds(retry.intervalInSecs) : retry.interval },
        })
      )
    }

    return step
  }

  /**
   * @summary Method to create a state machine
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.SfnStateMachineProps} props
   * @param {sfn.IChainable} definition
   * @param {logs.ILogGroup} logGroup
   * @param {iam.IRole} role
   */
  public createStateMachine(
    id: string,
    scope: common.CommonConstruct,
    props: types.SfnStateMachineProps,
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
