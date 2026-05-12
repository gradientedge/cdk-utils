import { Archive, IEventBus, IRuleTarget, Rule } from 'aws-cdk-lib/aws-events'
import { CloudWatchLogGroup, EcsTask, LambdaFunction, SfnStateMachine, SqsQueue } from 'aws-cdk-lib/aws-events-targets'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Chain, Map, StateMachine } from 'aws-cdk-lib/aws-stepfunctions'

import { CommonStackProps } from '../../common/index.js'
import {
  EventRuleProps,
  LogProps,
  QueueProps,
  SfnMapProps,
  SfnStateMachineProps,
  VpcProps,
} from '../../services/index.js'

/**
 * Properties for configuring an {@link EventHandler} construct
 */
/** @category Interface */
export interface EventHandlerProps extends CommonStackProps {
  /** The name of the custom EventBridge event bus */
  eventBusName: string
  /** The number of days to retain archived events */
  eventRetentionInDays: number
  /** The EventBridge rule configuration */
  eventRule?: EventRuleProps
  /** Whether to enable event archiving for replay */
  eventRuleArchiveEnabled: boolean
  /** The cron/rate expression for scheduled rules */
  eventRuleSchedule: string
  /** The SQS queue configuration for event buffering */
  eventSqs: QueueProps
  /** CloudFormation export name for an existing security group */
  securityGroupExportName: string
  /** VPC configuration for Lambda functions that require VPC access */
  vpc: VpcProps
  /** Name of an existing VPC to look up */
  vpcName?: string
  /** Step Functions state machine configuration */
  workflow: SfnStateMachineProps
  /** CloudWatch log group configuration for the workflow */
  workflowLog: LogProps
  /** Step Functions Map state configuration for parallel processing */
  workflowMapState: SfnMapProps
}

/**
 * Type definition for event handler resources used by the {@link EventHandler} construct
 */
/** @category Interface */
export interface EventHandlerType {
  /** The EventBridge event archive for replay */
  archive: Archive
  /** ECS task targets for EventBridge rules */
  ecsTargets: EcsTask[]
  /** The EventBridge event bus */
  eventBus: IEventBus
  /** Lambda function targets for EventBridge rules */
  lambdaTargets: LambdaFunction[]
  /** CloudWatch log group targets for EventBridge rules */
  logTargets: CloudWatchLogGroup[]
  /** The SQS queue for event buffering */
  queue: Queue
  /** The EventBridge rule */
  rule: Rule
  /** The event pattern for the EventBridge rule */
  rulePattern: any
  /** SQS queue targets for EventBridge rules */
  sqsTargets: SqsQueue[]
  /** Step Functions state machine targets for EventBridge rules */
  stepFunctionTargets: SfnStateMachine[]
  /** All combined rule targets */
  targets: IRuleTarget[]
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
