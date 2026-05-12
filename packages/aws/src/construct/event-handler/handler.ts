import { Archive, IEventBus, IRuleTarget, Rule } from 'aws-cdk-lib/aws-events'
import { CloudWatchLogGroup, EcsTask, LambdaFunction, SfnStateMachine, SqsQueue } from 'aws-cdk-lib/aws-events-targets'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Chain, Map, StateMachine } from 'aws-cdk-lib/aws-stepfunctions'

import { EventHandlerType } from './types.js'

/**
 * Container class to hold all event handler resources including targets, workflow, and rule state
 * @category Construct
 */
export class Handler implements EventHandlerType {
  /** The EventBridge event archive for replay */
  archive: Archive
  /** ECS task targets for EventBridge rules */
  ecsTargets: EcsTask[] = []
  /** The EventBridge event bus */
  eventBus: IEventBus
  /** The workflow step definition chain to use as the iterator in a Map state */
  eventWorkflowDefinition: Chain
  /** The Lambda functions created for event processing */
  lambdaFunctions: IFunction[] = []
  /** Lambda function targets for EventBridge rules */
  lambdaTargets: LambdaFunction[] = []
  /** CloudWatch log group targets for EventBridge rules */
  logTargets: CloudWatchLogGroup[] = []
  /** The SQS queue for event buffering */
  queue: Queue
  /** The EventBridge rule */
  rule: Rule
  /** The event pattern for the EventBridge rule */
  rulePattern: any
  /** SQS queue targets for EventBridge rules */
  sqsTargets: SqsQueue[] = []
  /** Step Functions state machine targets for EventBridge rules */
  stepFunctionTargets: SfnStateMachine[] = []
  /** All combined rule targets */
  targets: IRuleTarget[] = []
  /** The Step Functions state machine */
  workflow: StateMachine
  /** The workflow step definition chain */
  workflowDefinition: Chain
  /** The CloudWatch log group for workflow execution logs */
  workflowLogGroup: LogGroup
  /** The Step Functions Map state for parallel processing */
  workflowMapState: Map
  /** The IAM policy for the workflow execution role */
  workflowPolicy: PolicyDocument
  /** The IAM role for the workflow execution */
  workflowRole: Role
}
