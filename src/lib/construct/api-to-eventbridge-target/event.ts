import * as events from 'aws-cdk-lib/aws-events'
import * as logs from 'aws-cdk-lib/aws-logs'
import { ApiToEventBridgeTargetEventType } from './types'

/**
 * @classdesc Provides a construct to contain event resources for ApiToEventBridgeTargetWithSns
 */
export class ApiToEventbridgeTargetEvent implements ApiToEventBridgeTargetEventType {
  eventBus: events.IEventBus
  logGroup: logs.LogGroup
  logGroupFailure: logs.LogGroup
  logGroupSuccess: logs.LogGroup
  rule: events.Rule
  ruleFailure: events.Rule
  ruleSuccess: events.Rule
}