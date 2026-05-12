import { IEventBus, Rule } from 'aws-cdk-lib/aws-events'
import { LogGroup } from 'aws-cdk-lib/aws-logs'

import { ApiToEventBridgeTargetEventType } from './types.js'

/**
 * Provides a construct to contain event resources for ApiToEventBridgeTargetWithSns
 * @category Construct
 */
export class ApiToEventbridgeTargetEvent implements ApiToEventBridgeTargetEventType {
  /** The EventBridge event bus */
  eventBus: IEventBus
  /** The CloudWatch log group for event logging */
  logGroup: LogGroup
  /** The CloudWatch log group for failed event deliveries */
  logGroupFailure: LogGroup
  /** The CloudWatch log group for successful event deliveries */
  logGroupSuccess: LogGroup
  /** The EventBridge rule for routing events */
  rule: Rule
  /** The EventBridge rule for failed event deliveries */
  ruleFailure: Rule
  /** The EventBridge rule for successful event deliveries */
  ruleSuccess: Rule
}
