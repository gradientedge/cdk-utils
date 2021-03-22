import * as cdk from '@aws-cdk/core'
import * as logs from '@aws-cdk/aws-logs'
import { CommonConstruct } from './commonConstruct'
import { LogProps, MetricFilterProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
 * @category Management & Governance
 * @summary Provides operations on AWS CloudWatch.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.logsManager.createMetricFilter('MyMetricFilter', this, logGroup)
 * }
 *
 * @see [CDK CloudWatch Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-logs-readme.html}</li></i>
 */
export class LogManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {logs.ILogGroup} logGroup
   */
  public createMetricFilter(id: string, scope: CommonConstruct, logGroup: logs.ILogGroup) {
    if (!scope.props.metricFilters || scope.props.metricFilters.length == 0)
      throw `Metric Filter props undefined`

    const metricFilterProps = scope.props.metricFilters.find(
      (metricFilter: MetricFilterProps) => metricFilter.id === id
    )
    if (!metricFilterProps) throw `Could not find Metric Filter props for id:${id}`

    const metricFilter = new logs.MetricFilter(scope, `${id}`, {
      logGroup: logGroup,
      metricName: metricFilterProps.metricName,
      metricNamespace: metricFilterProps.metricNamespace,
      metricValue: metricFilterProps.metricValue,
      defaultValue: metricFilterProps.defaultValue,
      filterPattern: metricFilterProps.filterPattern,
    })

    const metric = metricFilterProps.options
      ? metricFilter.metric({
          dimensions: metricFilterProps.options.dimensions,
          statistic: metricFilterProps.options.statistic,
          period: metricFilterProps.periodInSecs
            ? cdk.Duration.seconds(metricFilterProps.periodInSecs)
            : cdk.Duration.minutes(5),
        })
      : metricFilter.metric()

    return { metricFilter, metric }
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createCfnLogGroup(id: string, scope: CommonConstruct) {
    if (!scope.props.logs || scope.props.logs.length == 0) throw `Logs props undefined`

    const logProps = scope.props.logs.find((log: LogProps) => log.id === id)
    if (!logProps) throw `Could not find log props for id:${id}`

    const logGroup = new logs.CfnLogGroup(scope, `${id}`, {
      logGroupName: `${logProps.logGroupName}-${scope.props.stage}`,
      retentionInDays: logProps.retentionInDays,
    })

    createCfnOutput(`${id}Arn`, scope, logGroup.attrArn)

    return logGroup
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createLogGroup(id: string, scope: CommonConstruct) {
    if (!scope.props.logs || scope.props.logs.length == 0) throw `Logs props undefined`

    const logProps = scope.props.logs.find((log: LogProps) => log.id === id)
    if (!logProps) throw `Could not find log props for id:${id}`

    const logGroup = new logs.LogGroup(scope, `${id}`, {
      logGroupName: `${logProps.logGroupName}-${scope.props.stage}`,
      retention: logProps.retentionInDays,
    })

    createCfnOutput(`${id}Arn`, scope, logGroup.logGroupArn)

    return logGroup
  }
}
