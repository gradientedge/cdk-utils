import { ArnFormat, Stack } from 'aws-cdk-lib'
import { IRule, IRuleTarget, RuleTargetConfig, RuleTargetInput } from 'aws-cdk-lib/aws-events'
import { TargetBaseProps, bindBaseTargetConfig } from 'aws-cdk-lib/aws-events-targets'
import { ILogGroup } from 'aws-cdk-lib/aws-logs'
import { CommonConstruct } from '../../../common'

/**
 * @classdesc Provides operations on AWS EventBridge
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
    logGroup: ILogGroup,
    props?: LogGroupNoPolicyProps
  ) {
    return new CloudWatchLogGroupNoPolicy(logGroup, props)
  }
}

/**
 * Customize the CloudWatch LogGroup Event Target
 */
export interface LogGroupNoPolicyProps extends TargetBaseProps {
  /**
   * The event to send to the CloudWatch LogGroup
   *
   * This will be the event logged into the CloudWatch LogGroup
   * @default - the entire EventBridge event
   */
  readonly event?: RuleTargetInput
}

/**
 * Use an AWS CloudWatch LogGroup as an event rule target, but don't apply a policy.
 */
export class CloudWatchLogGroupNoPolicy implements IRuleTarget {
  constructor(
    private readonly logGroup: ILogGroup,
    private readonly props: LogGroupNoPolicyProps = {}
  ) {}

  /**
   * Returns a RuleTarget that can be used to log an event into a CloudWatch LogGroup
   * @param _rule
   * @param _id
   */
  public bind(_rule: IRule, _id?: string): RuleTargetConfig {
    const logGroupStack = Stack.of(this.logGroup)

    return {
      ...bindBaseTargetConfig(this.props),
      arn: logGroupStack.formatArn({
        arnFormat: ArnFormat.COLON_RESOURCE_NAME,
        resource: 'log-group',
        resourceName: this.logGroup.logGroupName,
        service: 'logs',
      }),
      input: this.props.event,
      targetResource: this.logGroup,
    }
  }
}
