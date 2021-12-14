import * as cdk from 'aws-cdk-lib'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import { IMetric } from 'aws-cdk-lib/aws-cloudwatch'
import {
  AlarmProps,
  AlarmStatusWidgetProps,
  DashboardProps,
  GraphWidgetProps,
  LogQueryWidgetProps,
  MetricProps,
  NumericWidgetProps,
  TextWidgetProps,
} from '../types'
import { CommonConstruct } from '../common/commonConstruct'
import { CloudWatchWidgetType, createCfnOutput } from '../utils'

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
   * @param {AlarmProps} props
   */
  public createAlarmForExpression(id: string, scope: CommonConstruct, props: AlarmProps) {
    if (!props) throw `Alarm props undefined`

    if (!props.expression) throw `Could not find expression for Alarm props for id:${id}`
    if (!props.metricProps) throw `Could not find metricProps for Alarm props for id:${id}`

    const metrics: any = {}
    this.determineMetrics(scope, props.metricProps).map(
      (metric: watch.IMetric, index: number) => (metrics[`m${index}`] = metric)
    )
    const expression = new watch.MathExpression({
      expression: props.expression,
      usingMetrics: metrics,
      period: props.periodInSecs
        ? cdk.Duration.seconds(props.periodInSecs)
        : cdk.Duration.minutes(5),
    })

    const alarm = expression.createAlarm(scope, `${id}`, {
      alarmName: props.alarmName,
      alarmDescription: props.alarmDescription,
      threshold: props.threshold,
      evaluationPeriods: props.evaluationPeriods,
      comparisonOperator: props.comparisonOperator,
      treatMissingData: props.treatMissingData,
      datapointsToAlarm: props.datapointsToAlarm,
    })

    createCfnOutput(`${id}-alarmArn`, scope, alarm.alarmArn)
    createCfnOutput(`${id}-alarmName`, scope, alarm.alarmName)

    return alarm
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {AlarmProps} props
   * @param metric
   */
  public createAlarmForMetric(
    id: string,
    scope: CommonConstruct,
    props: AlarmProps,
    metric: watch.Metric
  ) {
    if (!props) throw `Alarm props undefined`

    const alarm = metric.createAlarm(scope, `${id}`, {
      alarmName: props.alarmName,
      alarmDescription: props.alarmDescription,
      threshold: props.threshold,
      evaluationPeriods: props.evaluationPeriods,
      comparisonOperator: props.comparisonOperator,
      treatMissingData: props.treatMissingData,
      datapointsToAlarm: props.datapointsToAlarm,
    })

    createCfnOutput(`${id}-alarmArn`, scope, alarm.alarmArn)
    createCfnOutput(`${id}-alarmName`, scope, alarm.alarmName)

    return alarm
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {DashboardProps} props
   * @param widgets
   */
  public createDashboard(
    id: string,
    scope: CommonConstruct,
    props: DashboardProps,
    widgets?: watch.IWidget[][]
  ) {
    if (!props) throw `Dashboard props undefined`

    return new watch.Dashboard(scope, `${id}`, {
      dashboardName: props.dashboardName,
      periodOverride: props.periodOverride,
      start: CloudWatchManager.determineTimeRange(props.start),
      end: CloudWatchManager.determineTimeRange(props.end),
      widgets: widgets,
    })
  }

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param props
   */
  public createWidgets(scope: CommonConstruct, props: any[]) {
    if (!props || props.length == 0) throw `Widget props undefined`

    const widgets: any = []
    props.forEach((widgetProps: any) =>
      widgets.push(this.createWidget(widgetProps.id, scope, widgetProps))
    )

    return widgets
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param props
   */
  public createWidget(id: string, scope: CommonConstruct, props: any) {
    if (!props) throw `Widget props undefined`

    const metrics = this.determineMetrics(scope, props.metricProps)
    let alarms,
      logGroupNames = []
    switch (props.type) {
      case CloudWatchWidgetType.Text:
        return this.createTextWidget(id, scope, props)
      case CloudWatchWidgetType.SingleValue:
        return this.createSingleValueWidget(id, scope, props, metrics)
      case CloudWatchWidgetType.Graph:
        return this.createGraphWidget(id, scope, props, metrics)
      case CloudWatchWidgetType.AlarmStatus:
        alarms = this.determineAlarms(id, scope, props.alarmProps)
        return this.createAlarmStatusWidget(id, scope, props, alarms)
      case CloudWatchWidgetType.LogQuery:
        logGroupNames = props.logGroupNames.map((name: string) => `${name}-${scope.props.stage}`)
        return this.createLogQueryWidget(id, scope, props, logGroupNames)
      default:
        throw 'Unsupported widget type'
    }
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {TextWidgetProps} props
   */
  public createTextWidget(id: string, scope: CommonConstruct, props: TextWidgetProps) {
    const widget = new watch.TextWidget({
      markdown: props.markdown,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {NumericWidgetProps} props
   * @param metrics
   */
  public createSingleValueWidget(
    id: string,
    scope: CommonConstruct,
    props: NumericWidgetProps,
    metrics: IMetric[]
  ) {
    const widget = new watch.SingleValueWidget({
      metrics: metrics,
      setPeriodToTimeRange: props.setPeriodToTimeRange,
      fullPrecision: props.fullPrecision,
      title: props.title,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {GraphWidgetProps} props
   * @param leftYMetrics
   * @param rightYMetrics
   */
  public createGraphWidget(
    id: string,
    scope: CommonConstruct,
    props: GraphWidgetProps,
    leftYMetrics?: IMetric[],
    rightYMetrics?: IMetric[]
  ) {
    const widget = new watch.GraphWidget({
      left: leftYMetrics,
      right: rightYMetrics,
      leftAnnotations: props.leftAnnotations,
      rightAnnotations: props.rightAnnotations,
      stacked: props.stacked,
      leftYAxis: props.leftYAxis,
      rightYAxis: props.rightYAxis,
      legendPosition: props.legendPosition,
      liveData: props.liveData,
      view: props.view,
      title: props.title,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {AlarmStatusWidgetProps} props
   * @param {watch.IAlarm[]} alarms
   */
  public createAlarmStatusWidget(
    id: string,
    scope: CommonConstruct,
    props: AlarmStatusWidgetProps,
    alarms: watch.IAlarm[]
  ) {
    const widget = new watch.AlarmStatusWidget({
      alarms: alarms,
      title: props.title,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {LogQueryWidgetProps} props
   * @param {string[]} logGroupNames
   */
  public createLogQueryWidget(
    id: string,
    scope: CommonConstruct,
    props: LogQueryWidgetProps,
    logGroupNames: string[]
  ) {
    const widget = new watch.LogQueryWidget({
      logGroupNames: logGroupNames,
      queryString: props.queryString,
      queryLines: props.queryLines,
      view: props.view,
      title: props.title,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {MetricProps[]} metricProps
   */
  private determineMetrics(scope: CommonConstruct, metricProps: MetricProps[]) {
    const metrics: watch.IMetric[] = []
    if (metricProps) {
      metricProps.forEach((metricProp: MetricProps) => {
        let metricDimensions: watch.DimensionHash = metricProp.dimensionsMap || {}
        if (metricProp.functionName) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              FunctionName: `${metricProp.functionName}-${scope.props.stage}`,
            },
          }
        }
        if (metricProp.dbClusterIdentifier) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
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
          dimensionsMap: metricDimensions,
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
   * @param {string?} range
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
   * @param {watch.AlarmProps[]} alarmProps
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
