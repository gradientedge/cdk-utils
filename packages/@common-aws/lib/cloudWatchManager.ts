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
      start: dashboardProps.start,
      end: dashboardProps.end,
      widgets: widgets,
    })
  }

  public createTextWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps
  ) {
    if (!props.textWidgets || props.textWidgets.length == 0) throw `Text Widget props undefined`

    const textWidgetProps = props.textWidgets.find((widget: TextWidgetProps) => widget.key === key)
    if (!textWidgetProps) throw `Could not find Text Widget props for key:${key}`

    const widget = new watch.TextWidget({
      markdown: textWidgetProps.markdown,
      width: textWidgetProps.width,
      height: textWidgetProps.height,
    })

    if (textWidgetProps.positionX && textWidgetProps.positionY)
      widget.position(textWidgetProps.positionX, textWidgetProps.positionY)

    return widget
  }

  public createNumericWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    metrics: IMetric[]
  ) {
    if (!props.numericWidgets || props.numericWidgets.length == 0)
      throw `Numeric Widget props undefined`

    const numericWidgetProps = props.numericWidgets.find(
      (widget: NumericWidgetProps) => widget.key === key
    )
    if (!numericWidgetProps) throw `Could not find Numeric Widget props for key:${key}`

    const widget = new watch.SingleValueWidget({
      metrics: metrics,
      setPeriodToTimeRange: numericWidgetProps.setPeriodToTimeRange,
      fullPrecision: numericWidgetProps.fullPrecision,
      title: numericWidgetProps.title,
      width: numericWidgetProps.width,
      height: numericWidgetProps.height,
    })

    if (numericWidgetProps.positionX && numericWidgetProps.positionY)
      widget.position(numericWidgetProps.positionX, numericWidgetProps.positionY)

    return widget
  }

  public createGraphWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    leftYMetrics?: IMetric[],
    rightYMetrics?: IMetric[]
  ) {
    if (!props.graphWidgets || props.graphWidgets.length == 0) throw `Graph Widget props undefined`

    const graphWidgetProps = props.graphWidgets.find(
      (widget: GraphWidgetProps) => widget.key === key
    )
    if (!graphWidgetProps) throw `Could not find Graph Widget props for key:${key}`

    const widget = new watch.GraphWidget({
      left: leftYMetrics,
      right: rightYMetrics,
      leftAnnotations: graphWidgetProps.leftAnnotations,
      rightAnnotations: graphWidgetProps.rightAnnotations,
      stacked: graphWidgetProps.stacked,
      leftYAxis: graphWidgetProps.leftYAxis,
      rightYAxis: graphWidgetProps.rightYAxis,
      legendPosition: graphWidgetProps.legendPosition,
      liveData: graphWidgetProps.liveData,
      view: graphWidgetProps.view,
      title: graphWidgetProps.title,
      width: graphWidgetProps.width,
      height: graphWidgetProps.height,
    })

    if (graphWidgetProps.positionX && graphWidgetProps.positionY)
      widget.position(graphWidgetProps.positionX, graphWidgetProps.positionY)

    return widget
  }

  public createAlarmStatusWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    alarms: IAlarm[]
  ) {
    if (!props.alarmStatusWidgets || props.alarmStatusWidgets.length == 0)
      throw `Alarm Status Widget props undefined`

    const alarmStatusWidgetProps = props.alarmStatusWidgets.find(
      (widget: AlarmStatusWidgetProps) => widget.key === key
    )
    if (!alarmStatusWidgetProps) throw `Could not find Alarm Status Widget props for key:${key}`

    const widget = new watch.AlarmStatusWidget({
      alarms: alarms,
      title: alarmStatusWidgetProps.title,
      width: alarmStatusWidgetProps.width,
      height: alarmStatusWidgetProps.height,
    })

    if (alarmStatusWidgetProps.positionX && alarmStatusWidgetProps.positionY)
      widget.position(alarmStatusWidgetProps.positionX, alarmStatusWidgetProps.positionY)

    return widget
  }

  public createLogQueryWidget(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    logGroupNames: string[]
  ) {
    if (!props.logQueryWidgets || props.logQueryWidgets.length == 0)
      throw `Log Query Widget props undefined`

    const logQueryWidgetProps = props.logQueryWidgets.find(
      (widget: LogQueryWidgetProps) => widget.key === key
    )
    if (!logQueryWidgetProps) throw `Could not find Log Query Widget props for key:${key}`

    const widget = new watch.LogQueryWidget({
      logGroupNames: logGroupNames,
      queryString: logQueryWidgetProps.queryString,
      queryLines: logQueryWidgetProps.queryLines,
      view: logQueryWidgetProps.view,
      title: logQueryWidgetProps.title,
      width: logQueryWidgetProps.width,
      height: logQueryWidgetProps.height,
    })

    if (logQueryWidgetProps.positionX && logQueryWidgetProps.positionY)
      widget.position(logQueryWidgetProps.positionX, logQueryWidgetProps.positionY)

    return widget
  }
}
