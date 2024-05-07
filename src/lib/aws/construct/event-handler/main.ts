import { Duration, Fn } from 'aws-cdk-lib'
import { ISecurityGroup, IVpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2'
import { Archive, EventBus, Schedule } from 'aws-cdk-lib/aws-events'
import { SfnStateMachine, SqsQueue } from 'aws-cdk-lib/aws-events-targets'
import { CfnQueuePolicy } from 'aws-cdk-lib/aws-sqs'
import { JsonPath, Map } from 'aws-cdk-lib/aws-stepfunctions'
import { Construct } from 'constructs'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { Handler } from './handler'
import { EventHandlerProps } from './types'

/**
 * @classdesc Provides a construct to create and deploy an EventBridge Event Handler
 * @example
 * import { EventHandler, EventHandlerProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends EventHandler {
 *   constructor(parent: Construct, id: string, props: EventHandlerProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class EventHandler extends CommonConstruct {
  props: EventHandlerProps
  id: string
  handler: Handler
  provisionTarget: boolean = true
  securityGroup: ISecurityGroup
  useMapState: boolean
  vpc: IVpc

  constructor(parent: Construct, id: string, props: EventHandlerProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
    this.handler = new Handler()
  }

  public initResources() {
    this.createSQSEventSource()
    this.createWorkflow()
    this.createEventRulePattern()
    this.createEventRuleTargets()
    this.resolveEventBus()
    this.createEventArchive()
    this.createEventRule()
  }

  /**
   * @summary Method to resolve common vpc  or create a new one.
   */
  protected resolveVpc() {
    if (this.props.vpcName) {
      this.vpc = this.vpcManager.retrieveCommonVpc(`${this.id}-vpc`, this, this.props.vpcName)
    }
  }

  /**
   * @summary Method to resolve the exported security group.
   */
  protected resolveSecurityGroup() {
    if (this.props.securityGroupExportName) {
      this.securityGroup = SecurityGroup.fromSecurityGroupId(
        this,
        `${this.id}-security-group`,
        Fn.importValue(this.props.securityGroupExportName)
      )
    }
  }

  /**
   * @summary Method to create sqs event source if queue targets are defined.
   */
  protected createSQSEventSource() {
    if (!this.props.eventSqs) return

    this.handler.queue = this.sqsManager.createQueue(`${this.id}-sqs-queue`, this, this.props.eventSqs)
    const sqsPolicyDocument = this.iamManager.createPolicyForSqsEvent(
      `${this.id}-sqs-policy-document`,
      this,
      this.handler.queue,
      this.handler.rule
    )
    new CfnQueuePolicy(this, `${this.id}-sqs-queue-policy`, {
      policyDocument: sqsPolicyDocument.toJSON(),
      queues: [this.handler.queue.queueUrl],
    })
    this.handler.sqsTargets = [new SqsQueue(this.handler.queue)]
  }

  /**
   * @summary Method to create the event rule pattern.
   */
  protected createEventRulePattern() {
    this.handler.rulePattern = this.props.eventRule.eventPattern
  }

  /**
   * @summary Method to create the event rule targets.
   */
  protected createEventRuleTargets() {
    this.handler.targets = [
      ...this.handler.stepFunctionTargets,
      ...this.handler.lambdaTargets,
      ...this.handler.sqsTargets,
      ...this.handler.ecsTargets,
      ...this.handler.logTargets,
    ]
  }

  /**
   * @summary Method to resolve the event bus name or use the default bus.
   */
  protected resolveEventBus() {
    this.handler.eventBus = EventBus.fromEventBusName(this, `${this.id}-bus`, this.props.eventBusName ?? 'default')
  }

  /**
   * @summary Method to create an event archive if the event rule is not a scheduled one.
   */
  protected createEventArchive() {
    /* do not enable for scheduled events */
    if (this.props.eventRule.schedule || this.props.eventRuleSchedule || !this.props.eventRuleArchiveEnabled) return
    this.handler.archive = new Archive(this, `${this.id}-archive`, {
      archiveName: `${this.props.eventRule.ruleName}-${this.props.stage}`.replace(
        `${this.node.tryGetContext('stackName')}-`,
        ''
      ),
      description: `Archive of events for ${this.props.eventRule.ruleName}`,
      eventPattern: this.handler.rulePattern,
      retention: Duration.days(this.props.eventRetentionInDays ?? 7),
      sourceEventBus: this.handler.eventBus,
    })
  }

  /**
   * @summary Method to create the event rule.
   */
  protected createEventRule() {
    let schedule
    if (this.props.eventRuleSchedule) {
      schedule = Schedule.expression(this.props.eventRuleSchedule)
    }
    this.handler.rule = this.eventManager.createRule(
      `${this.id}-rule`,
      this,
      {
        ...this.props.eventRule,
        eventPattern: this.handler.rulePattern,
        schedule: schedule,
      },
      this.props.eventBusName ? this.handler.eventBus : undefined,
      this.handler.targets
    )
  }

  /**
   * @summary Method to create the workflow steps.
   */
  protected createWorkflowSteps() {}

  /**
   * @summary Method to create the workflow definition.
   */
  protected createWorkflowDefinition() {
    if (this.useMapState) {
      this.handler.workflowMapState = new Map(this, `Map Iterator`, {
        ...this.props.workflowMapState,
        itemsPath: JsonPath.entirePayload,
      })
    }

    this.handler.workflowDefinition = this.handler.eventWorkflowDefinition
    if (this.useMapState) {
      this.handler.workflowMapState.itemProcessor(this.handler.workflowDefinition)
    }
  }

  /**
   * @summary Method to create the workflow policy.
   */
  protected createWorkflowPolicy() {}

  /**
   * @summary Method to create the workflow role.
   */
  protected createWorkflowRole() {
    this.handler.workflowRole = this.iamManager.createRoleForStepFunction(
      `${this.id}-workflow-role`,
      this,
      this.handler.workflowPolicy
    )
  }

  /**
   * @summary Method to create the workflow log group.
   */
  protected createWorkflowLogGroup() {
    this.handler.workflowLogGroup = this.logManager.createLogGroup(
      `${this.id}-workflow-log`,
      this,
      this.props.workflowLog
    )
  }

  /**
   * @summary Method to create the workflow state machine.
   */
  protected createWorkflowStateMachine() {
    this.handler.workflow = this.sfnManager.createStateMachine(
      `${this.id}-workflow`,
      this,
      this.props.workflow,
      this.useMapState ? this.handler.workflowMapState : this.handler.workflowDefinition,
      this.handler.workflowLogGroup,
      this.handler.workflowRole
    )
  }

  /**
   * @summary Method to create the workflow.
   */
  protected createWorkflow() {
    if (_.isEmpty(this.props.workflow)) return

    this.createWorkflowSteps()
    this.createWorkflowDefinition()
    this.createWorkflowPolicy()
    this.createWorkflowRole()
    this.createWorkflowLogGroup()
    this.createWorkflowStateMachine()
    if (this.provisionTarget) {
      this.handler.stepFunctionTargets = [new SfnStateMachine(this.handler.workflow)]
    }
  }
}
