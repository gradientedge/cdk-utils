import * as cdk from '@aws-cdk/core'
import * as logs from '@aws-cdk/aws-logs'
import * as watch from '@aws-cdk/aws-cloudwatch'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface LogProps extends logs.CfnLogGroupProps {
  id: string
}

export interface MetricFilterProps extends logs.MetricFilterProps {
  id: string
  periodInSecs: number
  options: watch.MetricOptions
}

export class LogManager {
  public createMetricFilter(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    logGroup: logs.ILogGroup
  ) {
    if (!props.metricFilters || props.metricFilters.length == 0)
      throw `Metric Filter props undefined`

    const metricFilterProps = props.metricFilters.find(
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
          period: cdk.Duration.seconds(metricFilterProps.periodInSecs),
        })
      : metricFilter.metric()

    return { metricFilter, metric }
  }

  public createCfnLogGroup(id: string, scope: CommonConstruct, props: CommonStackProps) {
    if (!props.logs || props.logs.length == 0) throw `Logs props undefined`

    const logProps = props.logs.find((log: LogProps) => log.id === id)
    if (!logProps) throw `Could not find log props for id:${id}`

    const logGroup = new logs.CfnLogGroup(scope, `${id}`, {
      logGroupName: `${logProps.logGroupName}-${props.stage}`,
      retentionInDays: logProps.retentionInDays,
    })

    createCfnOutput(`${id}Arn`, scope, logGroup.attrArn)

    return logGroup
  }

  public createLogGroup(id: string, scope: CommonConstruct, props: CommonStackProps) {
    if (!props.logs || props.logs.length == 0) throw `Logs props undefined`

    const logProps = props.logs.find((log: LogProps) => log.id === id)
    if (!logProps) throw `Could not find log props for id:${id}`

    const logGroup = new logs.LogGroup(scope, `${id}`, {
      logGroupName: `${logProps.logGroupName}-${props.stage}`,
      retention: logProps.retentionInDays,
    })

    createCfnOutput(`${id}Arn`, scope, logGroup.logGroupArn)

    return logGroup
  }
}
