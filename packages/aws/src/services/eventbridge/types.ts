import { CfnRuleProps, EventBusProps as EBProps, RuleProps as EBRuleProps } from 'aws-cdk-lib/aws-events'
import { CfnPipeProps } from 'aws-cdk-lib/aws-pipes'

import { TagProps } from '../../types/index.js'

/**
 * Properties for creating an EventBridge Pipe from an SQS queue to a Step Function.
 * @see {@link CfnPipeProps}
 */
/** @category Interface */
export interface SqsToSfnPipeProps extends CfnPipeProps {
  /** Optional filter pattern to apply to SQS messages before forwarding */
  pipeFilterPattern?: any
  /** Optional input template to transform the event before sending to the Step Function */
  sfnInputTemplate?: string
  /** The invocation type for the Step Function target (e.g. 'FIRE_AND_FORGET') */
  sfnInvocationType?: string
  /** The maximum number of SQS messages to process in a single batch */
  sqsBatchSize?: number
  /** The maximum batching window in seconds before sending the batch */
  sqsMaximumBatchingWindowInSeconds?: number
}

/**
 * Properties for creating an EventBridge Pipe from an SQS queue to a Lambda function.
 * @see {@link CfnPipeProps}
 */
/** @category Interface */
export interface SqsToLambdaPipeProps extends CfnPipeProps {
  /** Optional filter pattern to apply to SQS messages before forwarding */
  pipeFilterPattern?: any
  /** The maximum number of SQS messages to process in a single batch */
  sqsBatchSize?: number
  /** Optional input template to transform the event before sending to the Lambda function */
  lambdaInputTemplate?: string
  /** The maximum batching window in seconds before sending the batch */
  sqsMaximumBatchingWindowInSeconds?: number
}

/**
 * Properties for creating an EventBridge rule using the L2 construct.
 * @see {@link EBRuleProps}
 */
/** @category Interface */
export interface EventRuleProps extends EBRuleProps {
  /** Optional tags to apply to the event rule */
  tags?: TagProps[]
}

/**
 * Properties for creating an EventBridge rule using the L1 CfnRule construct.
 * @see {@link CfnRuleProps}
 */
/** @category Interface */
export interface RuleProps extends CfnRuleProps {
  /** Optional input to pass to the rule targets */
  input?: string
  /** Optional tags to apply to the rule */
  tags?: TagProps[]
}

/**
 * Properties for creating an EventBridge event bus.
 * @see {@link EBProps}
 */
/** @category Interface */
export interface EventBusProps extends EBProps {}

/**
 * Properties for creating an EventBridge Pipe from a DynamoDB stream to a Lambda function.
 * @see {@link CfnPipeProps}
 */
/** @category Interface */
export interface DynamoDbToLambdaPipeProps extends CfnPipeProps {
  /** Optional filter pattern to apply to DynamoDB stream records before forwarding */
  pipeFilterPattern?: any
  /** The maximum number of DynamoDB stream records to process in a single batch */
  dynamoDbBatchSize?: number
  /** The position in the DynamoDB stream to start reading from (e.g. 'LATEST', 'TRIM_HORIZON') */
  dynamoDbStartingPosition: string
}
