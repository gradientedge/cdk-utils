import { CfnRuleProps, EventBusProps as EBProps, RuleProps as EBRuleProps } from 'aws-cdk-lib/aws-events'
import { CfnPipeProps } from 'aws-cdk-lib/aws-pipes'
import { ResourceNameFormatterProps } from '../../common'
import { TagProps } from '../../types'

/**
 */
export interface SqsToSfnPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  sfnInputTemplate?: string
  sfnInvocationType?: string
  sqsBatchSize?: number
  sqsMaximumBatchingWindowInSeconds?: number
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 */
export interface SqsToLambdaPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  sqsBatchSize?: number
  lambdaInputTemplate?: string
  sqsMaximumBatchingWindowInSeconds?: number
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 */
export interface EventRuleProps extends EBRuleProps {
  resourceNameOptions?: ResourceNameFormatterProps
  tags?: TagProps[]
}

/**
 */
export interface RuleProps extends CfnRuleProps {
  input?: string
  resourceNameOptions?: ResourceNameFormatterProps
  tags?: TagProps[]
}

/**
 */
export interface EventBusProps extends EBProps {
  resourceNameOptions?: ResourceNameFormatterProps
}

/**
 }
 */
export interface DynamoDbToLambdaPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  dynamoDbBatchSize?: number
  dynamoDbStartingPosition: string
  resourceNameOptions?: ResourceNameFormatterProps
}
