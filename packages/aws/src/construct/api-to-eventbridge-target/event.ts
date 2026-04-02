import { IEventBus, Rule } from 'aws-cdk-lib/aws-events'
import { LogGroup } from 'aws-cdk-lib/aws-logs'

import { ApiToEventBridgeTargetEventType } from './types.js'

/**
 * Provides a construct to contain event resources for ApiToEventBridgeTargetWithSns
 * @category Construct
 */
export class ApiToEventbridgeTargetEvent implements ApiToEventBridgeTargetEventType {
  eventBus: IEventBus
  logGroup: LogGroup
  logGroupFailure: LogGroup
  logGroupSuccess: LogGroup
  rule: Rule
  ruleFailure: Rule
  ruleSuccess: Rule
}
