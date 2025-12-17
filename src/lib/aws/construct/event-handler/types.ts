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

export interface EventHandlerProps extends CommonStackProps {
  eventBusName: string
  eventRetentionInDays: number
  eventRule?: EventRuleProps
  eventRuleArchiveEnabled: boolean
  eventRuleSchedule: string
  eventSqs: QueueProps
  securityGroupExportName: string
  vpc: VpcProps
  vpcName?: string
  workflow: SfnStateMachineProps
  workflowLog: LogProps
  workflowMapState: SfnMapProps
}

export interface EventHandlerType {
  archive: Archive
  ecsTargets: EcsTask[]
  eventBus: IEventBus
  lambdaTargets: LambdaFunction[]
  logTargets: CloudWatchLogGroup[]
  queue: Queue
  rule: Rule
  rulePattern: any
  sqsTargets: SqsQueue[]
  stepFunctionTargets: SfnStateMachine[]
  targets: IRuleTarget[]
  workflow: StateMachine
  workflowDefinition: Chain
  workflowLogGroup: LogGroup
  workflowMapState: Map
  workflowPolicy: PolicyDocument
  workflowRole: Role
}
