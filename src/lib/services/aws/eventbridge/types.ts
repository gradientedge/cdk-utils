import { CfnPipeProps } from 'aws-cdk-lib/aws-pipes'
import { CfnRuleProps, EventBusProps as EBProps, RuleProps as EBRuleProps } from 'aws-cdk-lib/aws-events'
import { TagProps } from '../../../types'

/**
 }
 * @category cdk-utils.event-manager
 * @subcategory Properties
 */
export interface SqsToSfnPipeProps extends CfnPipeProps {
  pipeFilterPattern?: any
  sqsBatchSize?: number
  sqsMaximumBatchingWindowInSeconds?: number
  sfnInvocationType?: string
  sfnInputTemplate?: string
}

/**
 * @category cdk-utils.event-manager
 * @subcategory Properties
 */
export interface EventRuleProps extends EBRuleProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.event-manager
 * @subcategory Properties
 */
export interface RuleProps extends CfnRuleProps {
  input?: string
}

/**
 * @category cdk-utils.event-manager
 * @subcategory Properties
 */
export interface EventBusProps extends EBProps {}
