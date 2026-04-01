import { Archive, IEventBus, IRuleTarget, Rule } from 'aws-cdk-lib/aws-events'
import { CloudWatchLogGroup, EcsTask, LambdaFunction, SfnStateMachine, SqsQueue } from 'aws-cdk-lib/aws-events-targets'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { Queue } from 'aws-cdk-lib/aws-sqs'
import { Chain, Map, StateMachine } from 'aws-cdk-lib/aws-stepfunctions'
import { EventHandlerType } from './types.js'

export class Handler implements EventHandlerType {
  archive: Archive
  ecsTargets: EcsTask[] = []
  eventBus: IEventBus
  eventWorkflowDefinition: Chain
  lambdaFunctions: IFunction[] = []
  lambdaTargets: LambdaFunction[] = []
  logTargets: CloudWatchLogGroup[] = []
  queue: Queue
  rule: Rule
  rulePattern: any
  sqsTargets: SqsQueue[] = []
  stepFunctionTargets: SfnStateMachine[] = []
  targets: IRuleTarget[] = []
  workflow: StateMachine
  workflowDefinition: Chain
  workflowLogGroup: LogGroup
  workflowMapState: Map
  workflowPolicy: PolicyDocument
  workflowRole: Role
}
