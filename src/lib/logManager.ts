import * as cdk from '@aws-cdk/core'
import * as logs from '@aws-cdk/aws-logs'
import { CommonConstruct } from './commonConstruct'
import { LogProps, MetricFilterProps } from './types'
import { createCfnOutput } from './genericUtils'

export class LogManager {
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

    let metric = metricFilterProps.options
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