import * as cdk from 'aws-cdk-lib'
import * as events from 'aws-cdk-lib/aws-events'
import * as targets from 'aws-cdk-lib/aws-events-targets'
import * as logs from 'aws-cdk-lib/aws-logs'
import { CommonConstruct } from '../../../common'

/**
 * @classdesc Provides operations on AWS EventBridge Targets.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.eventTargetManager.createCloudWatchLogGroupNoPolicy('MyLogGrouptarget', this, myLogGroup)
 *   }
 * }
 * @see [CDK EventBridge Target Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_events_targets-readme.html}
 */
export class EventTargetManager {
  /**
   * @summary Method to create a cloud watch log group target without a policy.
   * - This method is created as a workaround for cdk issue - https://github.com/aws/aws-cdk/issues/17002
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param logGroup the log group
   * @param props the log group target properties
   */
  public createCloudWatchLogGroupNoPolicy(
    id: string,
    scope: CommonConstruct,
    logGroup: logs.ILogGroup,
    props?: LogGroupNoPolicyProps
  ) {
    return new CloudWatchLogGroupNoPolicy(logGroup, props)
  }
}

/**
 * Customize the CloudWatch LogGroup Event Target
 */
export interface LogGroupNoPolicyProps extends targets.TargetBaseProps {
  /**
   * The event to send to the CloudWatch LogGroup
   *
   * This will be the event logged into the CloudWatch LogGroup
   * @default - the entire EventBridge event
   */
  readonly event?: events.RuleTargetInput
}

/**
 * Use an AWS CloudWatch LogGroup as an event rule target, but don't apply a policy.
 */
export class CloudWatchLogGroupNoPolicy implements events.IRuleTarget {
  constructor(
    private readonly logGroup: logs.ILogGroup,
    private readonly props: LogGroupNoPolicyProps = {}
  ) {}

  /**
   * Returns a RuleTarget that can be used to log an event into a CloudWatch LogGroup
   * @param _rule
   * @param _id
   */
  public bind(_rule: events.IRule, _id?: string): events.RuleTargetConfig {
    const logGroupStack = cdk.Stack.of(this.logGroup)

    return {
      ...targets.bindBaseTargetConfig(this.props),
      arn: logGroupStack.formatArn({
        arnFormat: cdk.ArnFormat.COLON_RESOURCE_NAME,
        resource: 'log-group',
        resourceName: this.logGroup.logGroupName,
        service: 'logs',
      }),
      input: this.props.event,
      targetResource: this.logGroup,
    }
  }
}
