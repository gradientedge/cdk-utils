import * as cdk from '@aws-cdk/core'
import * as watch from '@aws-cdk/aws-cloudwatch'
import { CloudWatchWidgetType } from './types'
import { IMetric } from '@aws-cdk/aws-cloudwatch'
import { CommonConstruct } from './commonConstruct'
import { IWidget } from '@aws-cdk/aws-cloudwatch/lib/widget'
import { IAlarm } from '@aws-cdk/aws-cloudwatch/lib/alarm-base'

export interface DashboardProps extends watch.DashboardProps {
  key: string
  positionX: number
  positionY: number
}

export interface MetricProps extends watch.MetricProps {
  stageSuffix: boolean
  periodInSecs?: number
}

export interface TextWidgetProps extends watch.TextWidgetProps {
  key: string
  positionX: number
  positionY: number
}

export interface NumericWidgetProps extends watch.SingleValueWidgetProps {
  key: string
  positionX: number
  positionY: number
  metricProps?: watch.MetricProps[]
}

export interface GraphWidgetProps extends watch.GraphWidgetProps {
  key: string
  positionX: number
  positionY: number
  metricProps?: MetricProps[]
}

export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  key: string
  positionX: number
  positionY: number
  alarmProps?: watch.AlarmProps[]
}

export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  key: string
  positionX: number
  positionY: number
}

export class CloudWatchManager {
  public createDashboard(id: string, key: string, scope: CommonConstruct, widgets?: IWidget[][]) {
    if (!scope.props.dashboards || scope.props.dashboards.length == 0)
      throw `Dashboard props undefined`

    const dashboardProps = scope.props.dashboards.find(
      (dashboard: DashboardProps) => dashboard.key === key
    )
    if (!dashboardProps) throw `Could not find Dashboard props for key:${key}`

    return new watch.Dashboard(scope, `${id}`, {
      dashboardName: dashboardProps.dashboardName,
      periodOverride: dashboardProps.periodOverride,
      start: CloudWatchManager.determineTimeRange(dashboardProps.start),
      end: CloudWatchManager.determineTimeRange(dashboardProps.end),
      widgets: widgets,
    })
  }

  public createWidgets(scope: CommonConstruct) {
    if (!scope.props.widgets || scope.props.widgets.length == 0) throw `Widget props undefined`

    const widgets: any = []
    scope.props.widgets.forEach((widgetProps: any) =>
      widgets.push(this.createWidget(widgetProps.key, widgetProps.key, scope))
    )

    return widgets
  }

  public createWidget(id: string, key: string, scope: CommonConstruct) {
    if (!scope.props.widgets || scope.props.widgets.length == 0) throw `Widget props undefined`

    const widgetProps = scope.props.widgets.find((widget: any) => widget.key === key)
    if (!widgetProps) throw `Could not find Widget props for key:${key}`

    const metrics = this.determineMetrics(scope, widgetProps.metricProps)
    switch (widgetProps.type) {
      case CloudWatchWidgetType.Text:
        return this.createTextWidget(id, key, scope, widgetProps)
      case CloudWatchWidgetType.SingleValue:
        return this.createSingleValueWidget(id, key, scope, widgetProps, metrics)
      case CloudWatchWidgetType.Graph:
        return this.createGraphWidget(id, key, scope, widgetProps, metrics)
      case CloudWatchWidgetType.AlarmStatus:
        const alarms = this.determineAlarms(id, scope, widgetProps.alarmProps)
        return this.createAlarmStatusWidget(id, key, scope, widgetProps, alarms)
      case CloudWatchWidgetType.LogQuery:
        const logGroupNames = widgetProps.logGroupNames.map(
          (name: string) => `${name}-${scope.props.stage}`
        )
        return this.createLogQueryWidget(id, key, scope, widgetProps, logGroupNames)
      default:
        throw 'Unsupported widget type'
    }
  }

  public createTextWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    widgetProps: TextWidgetProps
  ) {
    const widget = new watch.TextWidget({
      markdown: widgetProps.markdown,
      width: widgetProps.width,
      height: widgetProps.height,
    })

    if (widgetProps.positionX && widgetProps.positionY)
      widget.position(widgetProps.positionX, widgetProps.positionY)

    return widget
  }

  public createSingleValueWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    widgetProps: NumericWidgetProps,
    metrics: IMetric[]
  ) {
    const widget = new watch.SingleValueWidget({
      metrics: metrics,
      setPeriodToTimeRange: widgetProps.setPeriodToTimeRange,
      fullPrecision: widgetProps.fullPrecision,
      title: widgetProps.title,
      width: widgetProps.width,
      height: widgetProps.height,
    })

    if (widgetProps.positionX && widgetProps.positionY)
      widget.position(widgetProps.positionX, widgetProps.positionY)

    return widget
  }

  public createGraphWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    widgetProps: GraphWidgetProps,
    leftYMetrics?: IMetric[],
    rightYMetrics?: IMetric[]
  ) {
    const widget = new watch.GraphWidget({
      left: leftYMetrics,
      right: rightYMetrics,
      leftAnnotations: widgetProps.leftAnnotations,
      rightAnnotations: widgetProps.rightAnnotations,
      stacked: widgetProps.stacked,
      leftYAxis: widgetProps.leftYAxis,
      rightYAxis: widgetProps.rightYAxis,
      legendPosition: widgetProps.legendPosition,
      liveData: widgetProps.liveData,
      view: widgetProps.view,
      title: widgetProps.title,
      width: widgetProps.width,
      height: widgetProps.height,
    })

    if (widgetProps.positionX && widgetProps.positionY)
      widget.position(widgetProps.positionX, widgetProps.positionY)

    return widget
  }

  public createAlarmStatusWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    widgetProps: AlarmStatusWidgetProps,
    alarms: IAlarm[]
  ) {
    const widget = new watch.AlarmStatusWidget({
      alarms: alarms,
      title: widgetProps.title,
      width: widgetProps.width,
      height: widgetProps.height,
    })

    if (widgetProps.positionX && widgetProps.positionY)
      widget.position(widgetProps.positionX, widgetProps.positionY)

    return widget
  }

  public createLogQueryWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    widgetProps: LogQueryWidgetProps,
    logGroupNames: string[]
  ) {
    const widget = new watch.LogQueryWidget({
      logGroupNames: logGroupNames,
      queryString: widgetProps.queryString,
      queryLines: widgetProps.queryLines,
      view: widgetProps.view,
      title: widgetProps.title,
      width: widgetProps.width,
      height: widgetProps.height,
    })

    if (widgetProps.positionX && widgetProps.positionY)
      widget.position(widgetProps.positionX, widgetProps.positionY)

    return widget
  }

  private determineMetrics(scope: CommonConstruct, metricProps: MetricProps[]) {
    const metrics: watch.IMetric[] = []
    if (metricProps) {
      metricProps.forEach((metricProp: MetricProps) => {
        const metric = new watch.Metric({
          namespace: metricProp.stageSuffix
            ? `${metricProp.namespace}-${scope.props.stage}`
            : metricProp.namespace,
          metricName: metricProp.stageSuffix
            ? `${metricProp.metricName}-${scope.props.stage}`
            : metricProp.metricName,
          dimensions: metricProp.dimensions,
          statistic: metricProp.statistic,
          period: metricProp.periodInSecs
            ? cdk.Duration.seconds(metricProp.periodInSecs)
            : cdk.Duration.minutes(5),
        })
        metrics.push(metric)
      })
    }

    return metrics
  }

  private static determineTimeRange(range?: string) {
    let moment = require('moment')

    switch (range) {
      case 'START_TODAY':
        return moment().startOf('day').format()
      case 'END_TODAY':
        return moment().endOf('day').format()
      default:
        return range
    }
  }

  private determineAlarms(id: string, scope: CommonConstruct, alarmProps: watch.AlarmProps[]) {
    const alarms: watch.IAlarm[] = []
    if (alarmProps) {
      alarmProps.forEach((alarmProp: watch.AlarmProps) => {
        if (!alarmProp.alarmName) throw `Alarm name undefined for ${id}`
        const alarmName = scope.isProductionStage()
          ? alarmProp.alarmName
          : `${alarmProp.alarmName}-${scope.props.stage}`
        const alarmArn = `arn:aws:cloudwatch:${cdk.Stack.of(scope).region}:${
          cdk.Stack.of(scope).account
        }:alarm:${alarmName}`
        const alarm = watch.Alarm.fromAlarmArn(scope, `${id}`, alarmArn)
        alarms.push(alarm)
      })
    }

    return alarms
  }
}
