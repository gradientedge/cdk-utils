import * as cdk from 'aws-cdk-lib'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS CloudWatch.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.logsManager.createMetricFilter('MyMetricFilter', this, logGroup)
 *   }
 * }
 *
 * @see [CDK CloudWatch Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_logs-readme.html}
 */
export class LogManager {
  /**
   * @summary Method to create a cloudwatch metric filter
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.MetricFilterProps} props
   * @param {logs.ILogGroup} logGroup
   */
  public createMetricFilter(
    id: string,
    scope: common.CommonConstruct,
    props: types.MetricFilterProps,
    logGroup: logs.ILogGroup
  ) {
    if (!props) throw `MetricFilter props undefined`

    const metricFilter = new logs.MetricFilter(scope, `${id}`, {
      logGroup: logGroup,
      metricName: props.metricName,
      metricNamespace: props.metricNamespace,
      metricValue: props.metricValue,
      defaultValue: props.defaultValue,
      filterPattern: props.filterPattern,
    })

    const metric = props.options
      ? metricFilter.metric({
          dimensionsMap: props.options.dimensionsMap,
          statistic: props.options.statistic,
          period: props.periodInSecs ? cdk.Duration.seconds(props.periodInSecs) : cdk.Duration.minutes(5),
        })
      : metricFilter.metric()

    return { metricFilter, metric }
  }

  /**
   * @summary Method to create a cloudwatch log group (cfn)
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LogProps} props
   */
  public createCfnLogGroup(id: string, scope: common.CommonConstruct, props: types.LogProps) {
    if (!props) throw `Logs props undefined`

    const logGroup = new logs.CfnLogGroup(scope, `${id}`, {
      logGroupName: `${props.logGroupName}-${scope.props.stage}`,
      retentionInDays: props.retention,
    })

    utils.createCfnOutput(`${id}-logGroupArn`, scope, logGroup.attrArn)

    return logGroup
  }

  /**
   * @summary Method to create a cloudwatch log group
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LogProps} props
   */
  public createLogGroup(id: string, scope: common.CommonConstruct, props: types.LogProps) {
    if (!props) throw `Logs props undefined`

    const logGroup = new logs.LogGroup(scope, `${id}`, {
      logGroupName: `${props.logGroupName}-${scope.props.stage}`,
      retention: props.retention,
      removalPolicy: props.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
    })

    utils.createCfnOutput(`${id}-logGroupArn`, scope, logGroup.logGroupArn)

    return logGroup
  }
}