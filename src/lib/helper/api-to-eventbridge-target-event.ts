import * as events from 'aws-cdk-lib/aws-events'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as types from '../types/aws'

/**
 * @stability stable
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory member
 * @classdesc Provides a construct to contain event resources for ApiToEventBridgeTargetWithSns
 */
export class ApiToEventbridgeTargetEvent implements types.ApiToEventBridgeTargetEventType {
  eventBus: events.IEventBus
  logGroup: logs.LogGroup
  logGroupFailure: logs.LogGroup
  logGroupSuccess: logs.LogGroup
  rule: events.Rule
  ruleFailure: events.Rule
  ruleSuccess: events.Rule
}
