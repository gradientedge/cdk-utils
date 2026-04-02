import { CfnRuleProps, EventBusProps as EBProps, RuleProps as EBRuleProps } from 'aws-cdk-lib/aws-events'
import { CfnPipeProps } from 'aws-cdk-lib/aws-pipes'

import { TagProps } from '../../types/index.js'

/**
 */
/** @category Interface */
export interface SqsToSfnPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  sfnInputTemplate?: string
  sfnInvocationType?: string
  sqsBatchSize?: number
  sqsMaximumBatchingWindowInSeconds?: number
}

/**
 */
/** @category Interface */
export interface SqsToLambdaPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  sqsBatchSize?: number
  lambdaInputTemplate?: string
  sqsMaximumBatchingWindowInSeconds?: number
}

/**
 */
/** @category Interface */
export interface EventRuleProps extends EBRuleProps {
  tags?: TagProps[]
}

/**
 */
/** @category Interface */
export interface RuleProps extends CfnRuleProps {
  input?: string
  tags?: TagProps[]
}

/**
 */
/** @category Interface */
export interface EventBusProps extends EBProps {}

/**
 }
 */
/** @category Interface */
export interface DynamoDbToLambdaPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  dynamoDbBatchSize?: number
  dynamoDbStartingPosition: string
}
