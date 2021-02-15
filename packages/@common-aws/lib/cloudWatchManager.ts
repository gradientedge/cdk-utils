import * as watch from '@aws-cdk/aws-cloudwatch'
import { IMetric } from '@aws-cdk/aws-cloudwatch'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { IWidget } from '@aws-cdk/aws-cloudwatch/lib/widget'
import { IAlarm } from '@aws-cdk/aws-cloudwatch/lib/alarm-base'

export interface DashboardProps extends watch.DashboardProps {
  key: string
  positionX: number
  positionY: number
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
}

export interface GraphWidgetProps extends watch.GraphWidgetProps {
  key: string
  positionX: number
  positionY: number
}

export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  key: string
  positionX: number
  positionY: number
}

export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  key: string
  positionX: number
  positionY: number
}

export class CloudWatchManager {
  public createDashboard(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    widgets?: IWidget[][]
  ) {
    if (!props.dashboards || props.dashboards.length == 0) throw `Dashboard props undefined`

    const dashboardProps = props.dashboards.find(
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

  public createWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    metrics?: IMetric[],
    alarms?: IAlarm[],
    logGroupNames?: string[]
  ) {
    if (!props.widgets || props.widgets.length == 0) throw `Widget props undefined`

    const widgetProps = props.widgets.find((widget: any) => widget.key === key)
    if (!widgetProps) throw `Could not find Widget props for key:${key}`

    switch (widgetProps.type) {
      case 'Text':
        return this.createTextWidget(id, key, scope, props, widgetProps)
      case 'SingleValue':
        if (!metrics) throw `Metrics not defined for ${id}`
        return this.createNumericWidget(id, key, scope, props, widgetProps, metrics)
      case 'Graph':
        return this.createGraphWidget(id, key, scope, props, widgetProps, metrics)
      case 'AlarmStatus':
        if (!alarms) throw `Alarms not defined for ${id}`
        return this.createAlarmStatusWidget(id, key, scope, props, widgetProps, alarms)
      case 'LogQuery':
        if (!logGroupNames) throw `logGroupNames not defined for ${id}`
        return this.createLogQueryWidget(id, key, scope, props, widgetProps, logGroupNames)
      default:
        throw 'Unsupported widget type'
    }
  }

  protected createTextWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
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

  protected createNumericWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
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

  protected createGraphWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
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

  protected createAlarmStatusWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
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

  protected createLogQueryWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
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
}
