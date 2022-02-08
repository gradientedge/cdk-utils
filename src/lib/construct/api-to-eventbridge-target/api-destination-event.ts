import * as events from 'aws-cdk-lib/aws-events'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as types from '../../types/aws'

/**
 * @stability stable
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory member
 * @classdesc Provides a construct to contain event resources for ApiToEventBridgeTarget
 */
export class ApiDestinationEvent implements types.ApiDestinationEventType {
  eventBus: events.IEventBus
  logGroupFailure: logs.LogGroup
  logGroupSuccess: logs.LogGroup
  ruleFailure: events.Rule
  ruleSuccess: events.Rule
}
