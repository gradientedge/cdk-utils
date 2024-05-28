import { CfnPipeProps } from 'aws-cdk-lib/aws-pipes'
import { CfnRuleProps, EventBusProps as EBProps, RuleProps as EBRuleProps } from 'aws-cdk-lib/aws-events'
import { TagProps } from '../../types'

/**
 */
export interface SqsToSfnPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  sfnInputTemplate?: string
  sfnInvocationType?: string
  sqsBatchSize?: number
  sqsMaximumBatchingWindowInSeconds?: number
}

/**
 */
export interface SqsToLambdaPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  sqsBatchSize?: number
  lambdaInputTemplate?: string
  sqsMaximumBatchingWindowInSeconds?: number
}

/**
 */
export interface EventRuleProps extends EBRuleProps {
  tags?: TagProps[]
}

/**
 */
export interface RuleProps extends CfnRuleProps {
  input?: string
}

/**
 */
export interface EventBusProps extends EBProps {}

/**
 }
 */
export interface DynamoDbToLambdaPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  dynamoDbBatchSize?: number
  dynamoDbStartingPosition: string
}
