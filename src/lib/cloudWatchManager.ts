import * as cdk from '@aws-cdk/core'
import * as watch from '@aws-cdk/aws-cloudwatch'
import { IMetric } from '@aws-cdk/aws-cloudwatch'
import {
  AlarmProps,
  AlarmStatusWidgetProps,
  DashboardProps,
  GraphWidgetProps,
  LogQueryWidgetProps,
  MetricProps,
  NumericWidgetProps,
  TextWidgetProps,
} from './types'
import { CommonConstruct } from './commonConstruct'
import { CloudWatchWidgetType, createCfnOutput } from './genericUtils'

/**
 * @category Management & Governance
 * @summary Provides operations on AWS CloudWatch.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils/lib/commonConstruct'
 * import { CommonStackProps } from '@gradientedge/cdk-utils/lib/types'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.cloudWatchManager.createAlarmForMetric('MyAlarm', this, metric)
 * }
 *
 * @see [CDK CloudWatch Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cloudwatch-readme.html}</li></i>
 */
export class CloudWatchManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createAlarmForExpression(id: string, scope: CommonConstruct) {
    if (!scope.props.alarms || scope.props.alarms.length == 0) throw `Alarm props undefined`

    const alarmProps = scope.props.alarms.find((alarm: AlarmProps) => alarm.id === id)
    if (!alarmProps) throw `Could not find Alarm props for id:${id}`
    if (!alarmProps.expression) throw `Could not find expression for Alarm props for id:${id}`
    if (!alarmProps.metricProps) throw `Could not find metricProps for Alarm props for id:${id}`

    const metrics: any = {}
    this.determineMetrics(scope, alarmProps.metricProps).map(
      (metric: watch.IMetric, index: number) => (metrics[`m${index}`] = metric)
    )
    const expression = new watch.MathExpression({
      expression: alarmProps.expression,
      usingMetrics: metrics,
      period: alarmProps.periodInSecs
        ? cdk.Duration.seconds(alarmProps.periodInSecs)
        : cdk.Duration.minutes(5),
    })

    const alarm = expression.createAlarm(scope, `${id}`, {
      alarmName: alarmProps.alarmName,
      alarmDescription: alarmProps.alarmDescription,
      threshold: alarmProps.threshold,
      evaluationPeriods: alarmProps.evaluationPeriods,
      comparisonOperator: alarmProps.comparisonOperator,
      treatMissingData: alarmProps.treatMissingData,
      datapointsToAlarm: alarmProps.datapointsToAlarm,
    })

    createCfnOutput(`${id}Arn`, scope, alarm.alarmArn)
    createCfnOutput(`${id}Name`, scope, alarm.alarmName)

    return alarm
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param metric
   */
  public createAlarmForMetric(id: string, scope: CommonConstruct, metric: watch.Metric) {
    if (!scope.props.alarms || scope.props.alarms.length == 0) throw `Alarm props undefined`

    const alarmProps = scope.props.alarms.find((alarm: AlarmProps) => alarm.id === id)
    if (!alarmProps) throw `Could not find Alarm props for id:${id}`

    const alarm = metric.createAlarm(scope, `${id}`, {
      alarmName: alarmProps.alarmName,
      alarmDescription: alarmProps.alarmDescription,
      threshold: alarmProps.threshold,
      evaluationPeriods: alarmProps.evaluationPeriods,
      comparisonOperator: alarmProps.comparisonOperator,
      treatMissingData: alarmProps.treatMissingData,
      datapointsToAlarm: alarmProps.datapointsToAlarm,
    })

    createCfnOutput(`${id}Arn`, scope, alarm.alarmArn)
    createCfnOutput(`${id}Name`, scope, alarm.alarmName)

    return alarm
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param widgets
   */
  public createDashboard(id: string, scope: CommonConstruct, widgets?: watch.IWidget[][]) {
    if (!scope.props.dashboards || scope.props.dashboards.length == 0)
      throw `Dashboard props undefined`

    const dashboardProps = scope.props.dashboards.find(
      (dashboard: DashboardProps) => dashboard.id === id
    )
    if (!dashboardProps) throw `Could not find Dashboard props for id:${id}`

    return new watch.Dashboard(scope, `${id}`, {
      dashboardName: dashboardProps.dashboardName,
      periodOverride: dashboardProps.periodOverride,
      start: CloudWatchManager.determineTimeRange(dashboardProps.start),
      end: CloudWatchManager.determineTimeRange(dashboardProps.end),
      widgets: widgets,
    })
  }

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createWidgets(scope: CommonConstruct) {
    if (!scope.props.widgets || scope.props.widgets.length == 0) throw `Widget props undefined`

    const widgets: any = []
    scope.props.widgets.forEach((widgetProps: any) =>
      widgets.push(this.createWidget(widgetProps.id, scope))
    )

    return widgets
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createWidget(id: string, scope: CommonConstruct) {
    if (!scope.props.widgets || scope.props.widgets.length == 0) throw `Widget props undefined`

    const widgetProps = scope.props.widgets.find((widget: any) => widget.id === id)
    if (!widgetProps) throw `Could not find Widget props for id:${id}`

    const metrics = this.determineMetrics(scope, widgetProps.metricProps)
    let alarms,
      logGroupNames = []
    switch (widgetProps.type) {
      case CloudWatchWidgetType.Text:
        return this.createTextWidget(id, scope, widgetProps)
      case CloudWatchWidgetType.SingleValue:
        return this.createSingleValueWidget(id, scope, widgetProps, metrics)
      case CloudWatchWidgetType.Graph:
        return this.createGraphWidget(id, scope, widgetProps, metrics)
      case CloudWatchWidgetType.AlarmStatus:
        alarms = this.determineAlarms(id, scope, widgetProps.alarmProps)
        return this.createAlarmStatusWidget(id, scope, widgetProps, alarms)
      case CloudWatchWidgetType.LogQuery:
        logGroupNames = widgetProps.logGroupNames.map(
          (name: string) => `${name}-${scope.props.stage}`
        )
        return this.createLogQueryWidget(id, scope, widgetProps, logGroupNames)
      default:
        throw 'Unsupported widget type'
    }
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param widgetProps
   */
  public createTextWidget(id: string, scope: CommonConstruct, widgetProps: TextWidgetProps) {
    const widget = new watch.TextWidget({
      markdown: widgetProps.markdown,
      width: widgetProps.width,
      height: widgetProps.height,
    })

    if (widgetProps.positionX && widgetProps.positionY)
      widget.position(widgetProps.positionX, widgetProps.positionY)

    return widget
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param widgetProps
   * @param metrics
   */
  public createSingleValueWidget(
    id: string,
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

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param widgetProps
   * @param leftYMetrics
   * @param rightYMetrics
   */
  public createGraphWidget(
    id: string,
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

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param widgetProps
   * @param alarms
   */
  public createAlarmStatusWidget(
    id: string,
    scope: CommonConstruct,
    widgetProps: AlarmStatusWidgetProps,
    alarms: watch.IAlarm[]
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

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param widgetProps
   * @param logGroupNames
   */
  public createLogQueryWidget(
    id: string,
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

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param metricProps
   */
  private determineMetrics(scope: CommonConstruct, metricProps: MetricProps[]) {
    const metrics: watch.IMetric[] = []
    if (metricProps) {
      metricProps.forEach((metricProp: MetricProps) => {
        let metricDimensions: watch.DimensionHash = metricProp.dimensions || {}
        if (metricProp.functionName) {
          metricDimensions = {
            ...metricProp.dimensions,
            ...{
              FunctionName: `${metricProp.functionName}-${scope.props.stage}`,
            },
          }
        }
        if (metricProp.dbClusterIdentifier) {
          metricDimensions = {
            ...metricProp.dimensions,
            ...{
              DBClusterIdentifier: `${metricProp.dbClusterIdentifier}-${scope.props.stage}`,
            },
          }
        }
        const metric = new watch.Metric({
          namespace: metricProp.stageSuffix
            ? `${metricProp.namespace}-${scope.props.stage}`
            : metricProp.namespace,
          metricName: metricProp.stageSuffix
            ? `${metricProp.metricName}-${scope.props.stage}`
            : metricProp.metricName,
          dimensions: metricDimensions,
          statistic: metricProp.statistic,
          region: metricProp.region,
          period: metricProp.periodInSecs
            ? cdk.Duration.seconds(metricProp.periodInSecs)
            : cdk.Duration.minutes(5),
        })
        metrics.push(metric)
      })
    }

    return metrics
  }

  /**
   *
   * @param range
   */
  private static determineTimeRange(range?: string) {
    const moment = require('moment')

    switch (range) {
      case 'START_TODAY':
        return moment().startOf('day').format()
      case 'END_TODAY':
        return moment().endOf('day').format()
      default:
        return range
    }
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param alarmProps
   */
  private determineAlarms(id: string, scope: CommonConstruct, alarmProps: watch.AlarmProps[]) {
    const alarms: watch.IAlarm[] = []
    if (alarmProps) {
      alarmProps.forEach((alarmProp: watch.AlarmProps) => {
        if (!alarmProp.alarmName) throw `Alarm name undefined for ${id}`
        const alarmArn = `arn:aws:cloudwatch:${cdk.Stack.of(scope).region}:${
          cdk.Stack.of(scope).account
        }:alarm:${alarmProp.alarmName}`
        const alarm = watch.Alarm.fromAlarmArn(scope, `${alarmProp.alarmName}`, alarmArn)
        alarms.push(alarm)
      })
    }

    return alarms
  }
}
