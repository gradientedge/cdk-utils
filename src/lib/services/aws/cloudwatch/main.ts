import * as cdk from 'aws-cdk-lib'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import { IMetric } from 'aws-cdk-lib/aws-cloudwatch'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import {
  AlarmProps,
  AlarmStatusWidgetProps,
  DashboardProps,
  GraphWidgetProps,
  GuageWidgetProps,
  LogQueryWidgetProps,
  MetricProps,
  NumericWidgetProps,
  TextWidgetProps,
} from './types'

/**
 */
enum CloudWatchWidgetType {
  Text = 'Text',
  SingleValue = 'SingleValue',
  Gauge = 'Gauge',
  Graph = 'Graph',
  AlarmStatus = 'AlarmStatus',
  LogQuery = 'LogQuery',
}

/**
 * @classdesc Provides operations on AWS CloudWatch.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.cloudWatchManager.createAlarmForMetric('MyAlarm', this, metric)
 *   }
 * }
 * @see [CDK CloudWatch Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html}
 */
export class CloudWatchManager {
  /**
   * @summary Method to create a cloudwatch alarm for a given expression
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createAlarmForExpression(id: string, scope: CommonConstruct, props: AlarmProps) {
    if (!props) throw `Alarm props undefined for ${id}`

    if (!props.expression) throw `Could not find expression for Alarm props for id:${id}`
    if (!props.metricProps) throw `Could not find metricProps for Alarm props for id:${id}`

    const metrics: any = {}
    this.determineMetrics(scope, props.metricProps).map(
      (metric: watch.IMetric, index: number) => (metrics[`m${index}`] = metric)
    )
    const expression = new watch.MathExpression({
      expression: props.expression,
      period: props.periodInSecs ? cdk.Duration.seconds(props.periodInSecs) : cdk.Duration.minutes(5),
      usingMetrics: metrics,
    })

    const alarm = expression.createAlarm(scope, `${id}`, {
      alarmDescription: props.alarmDescription,
      alarmName: props.alarmName,
      comparisonOperator: props.comparisonOperator,
      datapointsToAlarm: props.datapointsToAlarm,
      evaluationPeriods: props.evaluationPeriods,
      threshold: props.threshold,
      treatMissingData: props.treatMissingData,
    })

    utils.createCfnOutput(`${id}-alarmArn`, scope, alarm.alarmArn)
    utils.createCfnOutput(`${id}-alarmName`, scope, alarm.alarmName)

    return alarm
  }

  /**
   * @summary Method to create a cloudwatch alarm for a given metric
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param metric
   */
  public createAlarmForMetric(id: string, scope: CommonConstruct, props: AlarmProps, metric: watch.Metric) {
    if (!props) throw `Alarm props undefined for ${id}`

    const alarm = metric.createAlarm(scope, `${id}`, {
      alarmDescription: props.alarmDescription,
      alarmName: props.alarmName,
      comparisonOperator: props.comparisonOperator,
      datapointsToAlarm: props.datapointsToAlarm,
      evaluationPeriods: props.evaluationPeriods,
      threshold: props.threshold,
      treatMissingData: props.treatMissingData,
    })

    utils.createCfnOutput(`${id}-alarmArn`, scope, alarm.alarmArn)
    utils.createCfnOutput(`${id}-alarmName`, scope, alarm.alarmName)

    return alarm
  }

  /**
   * @summary Method to create a cloudwatch dashboard
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param widgets
   */
  public createDashboard(id: string, scope: CommonConstruct, props: DashboardProps, widgets?: watch.IWidget[][]) {
    if (!props) throw `Dashboard props undefined for ${id}`

    const dashboard = new watch.Dashboard(scope, `${id}`, {
      dashboardName: props.dashboardName,
      end: CloudWatchManager.determineTimeRange(props.end),
      periodOverride: props.periodOverride,
      start: CloudWatchManager.determineTimeRange(props.start),
      widgets: widgets,
    })

    utils.createCfnOutput(`${id}-dashboardName`, scope, props.dashboardName)

    return dashboard
  }

  /**
   * @summary Method to create cloudwatch widgets
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createWidgets(scope: CommonConstruct, props: any[]) {
    if (!props || props.length == 0) throw `Widget props undefined`

    const widgets: any = []
    props.forEach((widgetProps: any) => widgets.push(this.createWidget(widgetProps.id, scope, widgetProps)))

    return widgets
  }

  /**
   * @summary Method to create a cloudwatch widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createWidget(id: string, scope: CommonConstruct, props: any) {
    if (!props) throw `Widget props undefined for ${id}`

    const metrics = this.determineMetrics(scope, props.metricProps)
    let alarms,
      logGroupNames = []
    switch (props.type) {
      case CloudWatchWidgetType.Text:
        return this.createTextWidget(id, scope, props)
      case CloudWatchWidgetType.SingleValue:
        return this.createSingleValueWidget(id, scope, props, metrics)
      case CloudWatchWidgetType.Gauge:
        return this.createGuageWidget(id, scope, props, metrics)
      case CloudWatchWidgetType.Graph:
        return this.createGraphWidget(id, scope, props, metrics)
      case CloudWatchWidgetType.AlarmStatus:
        alarms = this.determineAlarms(id, scope, props.alarmProps)
        return this.createAlarmStatusWidget(id, scope, props, alarms)
      case CloudWatchWidgetType.LogQuery:
        logGroupNames = props.logGroupNames.map((name: string) => `${name}-${scope.props.stage}`)
        return this.createLogQueryWidget(id, scope, props, logGroupNames)
      default:
        throw `Unsupported widget type ${props.type}`
    }
  }

  /**
   * @summary Method to create a cloudfront distribution widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param distributionId the cloudfront distribution id
   */
  public createCloudfrontDistributionWidget(id: string, scope: CommonConstruct, props: any, distributionId: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ distributionId: distributionId } })),
      },
    })
  }

  /**
   * @summary Method to create a step function widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param stateMachineArn the step function arn
   */
  public createStateWidget(id: string, scope: CommonConstruct, props: any, stateMachineArn: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ stateMachineArn: stateMachineArn } })),
      },
    })
  }

  /**
   * @summary Method to create an event widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param eventBusName the event bus name
   * @param ruleName the event rule name
   */
  public createEventWidget(id: string, scope: CommonConstruct, props: any, eventBusName: string, ruleName: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({
          ...metricProp,
          ...{ eventBusName: eventBusName, ruleName: ruleName },
        })),
      },
    })
  }

  /**
   * @summary Method to create an api gateway widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param apiName the api name
   */
  public createApiGatewayWidget(id: string, scope: CommonConstruct, props: any, apiName: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ apiName: apiName } })),
      },
    })
  }

  /**
   * @summary Method to create a lambda function widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param functionName the lambda function name
   */
  public createLambdaWidget(id: string, scope: CommonConstruct, props: any, functionName: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ functionName: functionName } })),
      },
    })
  }

  /**
   * @summary Method to create a custom widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param service the service identifier
   */
  public createCustomWidget(id: string, scope: CommonConstruct, props: any, service: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ service: service } })),
      },
    })
  }

  /**
   * @summary Method to create an ecs cluster widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param clusterName the ecs cluster name
   */
  public createEcsClusterWidget(id: string, scope: CommonConstruct, props: any, clusterName: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ clusterName: clusterName } })),
      },
    })
  }

  /**
   * @summary Method to create an ecs service widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param clusterName the ecs cluster name
   * @param serviceName the ecs service name
   */
  public createEcsServiceWidget(
    id: string,
    scope: CommonConstruct,
    props: any,
    clusterName: string,
    serviceName: string
  ) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({
          ...metricProp,
          ...{ clusterName: clusterName, serviceName: serviceName },
        })),
      },
    })
  }

  /**
   * @summary Method to create an elb widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param loadBalancer the loadbalancer reference
   */
  public createElbWidget(id: string, scope: CommonConstruct, props: any, loadBalancer: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ loadBalancer: loadBalancer } })),
      },
    })
  }

  /**
   * @summary Method to create an elasticache widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param cacheClusterId the elasticache cluster id
   */
  public createCacheWidget(id: string, scope: CommonConstruct, props: any, cacheClusterId: string) {
    if (!props) throw `Widget props undefined for ${id}`
    const metricProps: any[] = props.metricProps
    return this.createWidget(id, scope, {
      ...props,
      ...{
        metricProps: metricProps.map(metricProp => ({ ...metricProp, ...{ cacheClusterId: cacheClusterId } })),
      },
    })
  }

  /**
   * @summary Method to create a cloudwatch text widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createTextWidget(id: string, scope: CommonConstruct, props: TextWidgetProps) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.TextWidget({
      height: props.height,
      markdown: props.markdown,
      width: props.width,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch numeric widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param metrics
   */
  public createSingleValueWidget(id: string, scope: CommonConstruct, props: NumericWidgetProps, metrics: IMetric[]) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.SingleValueWidget({
      fullPrecision: props.fullPrecision,
      height: props.height,
      metrics: metrics,
      region: props.region ?? scope.props.region,
      setPeriodToTimeRange: props.setPeriodToTimeRange,
      sparkline: props.sparkline,
      title: props.title,
      width: props.width,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch guage widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param metrics
   */
  public createGuageWidget(id: string, scope: CommonConstruct, props: GuageWidgetProps, metrics: IMetric[]) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.GaugeWidget({
      height: props.height,
      leftYAxis: props.leftYAxis,
      metrics: metrics,
      region: props.region ?? scope.props.region,
      setPeriodToTimeRange: props.setPeriodToTimeRange,
      statistic: props.statistic,
      title: props.title,
      width: props.width,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch graph widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
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
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.GraphWidget({
      height: props.height,
      left: leftYMetrics,
      leftAnnotations: props.leftAnnotations,
      leftYAxis: props.leftYAxis,
      legendPosition: props.legendPosition,
      liveData: props.liveData,
      region: props.region ?? scope.props.region,
      right: rightYMetrics,
      rightAnnotations: props.rightAnnotations,
      rightYAxis: props.rightYAxis,
      stacked: props.stacked,
      title: props.title,
      view: props.view,
      width: props.width,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch alarm status widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param alarms
   */
  public createAlarmStatusWidget(
    id: string,
    scope: CommonConstruct,
    props: AlarmStatusWidgetProps,
    alarms: watch.IAlarm[]
  ) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.AlarmStatusWidget({
      alarms: alarms,
      height: props.height,
      title: props.title,
      width: props.width,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch log query widget
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param logGroupNames
   */
  public createLogQueryWidget(id: string, scope: CommonConstruct, props: LogQueryWidgetProps, logGroupNames: string[]) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.LogQueryWidget({
      height: props.height,
      logGroupNames: logGroupNames,
      queryLines: props.queryLines,
      queryString: props.queryString,
      region: props.region ?? scope.props.region,
      title: props.title,
      view: props.view,
      width: props.width,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Utility method to determine the metrics and dimensions
   * @param scope scope in which this resource is defined
   * @param metricProps
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
              FunctionName: `${metricProp.functionName}`,
            },
          }
        }
        if (metricProp.serviceName && metricProp.clusterName) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              ClusterName: `${metricProp.clusterName}`,
              ServiceName: `${metricProp.serviceName}`,
            },
          }
        }
        if (!metricProp.serviceName && metricProp.clusterName) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              ClusterName: `${metricProp.clusterName}`,
            },
          }
        }
        if (metricProp.serviceName && !metricProp.clusterName) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              ServiceName: `${metricProp.serviceName}`,
            },
          }
        }
        if (metricProp.loadBalancer) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              LoadBalancer: `${metricProp.loadBalancer}`,
            },
          }
        }
        if (metricProp.service) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              service: `${metricProp.service}`,
            },
          }
        }
        if (metricProp.distributionId) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              DistributionId: `${metricProp.distributionId}`,
              Region: `Global`,
            },
          }
        }
        if (metricProp.apiName) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              ApiName: `${metricProp.apiName}`,
            },
          }
        }
        if (metricProp.cacheClusterId) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              CacheClusterId: `${metricProp.cacheClusterId}`,
            },
          }
        }
        if (metricProp.dbClusterIdentifier) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              DBClusterIdentifier: `${metricProp.dbClusterIdentifier}`,
            },
          }
        }
        if (metricProp.stateMachineArn) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              StateMachineArn: `${metricProp.stateMachineArn}`,
            },
          }
        }

        if (metricProp.eventBusName && metricProp.ruleName) {
          metricDimensions = {
            ...metricProp.dimensionsMap,
            ...{
              EventBusName: `${metricProp.eventBusName}`,
              RuleName: `${metricProp.ruleName}`,
            },
          }
        }
        const metric = new watch.Metric({
          dimensionsMap: metricDimensions,
          metricName: metricProp.stageSuffix ? `${metricProp.metricName}-${scope.props.stage}` : metricProp.metricName,
          namespace: metricProp.stageSuffix ? `${metricProp.namespace}-${scope.props.stage}` : metricProp.namespace,
          period: metricProp.periodInSecs ? cdk.Duration.seconds(metricProp.periodInSecs) : cdk.Duration.minutes(5),
          region: metricProp.region,
          statistic: metricProp.statistic,
        })
        metrics.push(metric)
      })
    }

    return metrics
  }

  /**
   * @summary Utility method to determine the time range
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
   * @summary Utility method to determine the configured alarms
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param alarmProps
   */
  private determineAlarms(id: string, scope: CommonConstruct, alarmProps: watch.AlarmProps[]) {
    const alarms: watch.IAlarm[] = []
    if (alarmProps) {
      alarmProps.forEach((alarmProp: watch.AlarmProps) => {
        if (!alarmProp.alarmName) throw `Alarm name undefined for ${id}`
        const alarmArn = `arn:aws:cloudwatch:${cdk.Stack.of(scope).region}:${cdk.Stack.of(scope).account}:alarm:${
          alarmProp.alarmName
        }`
        const alarm = watch.Alarm.fromAlarmArn(scope, `${alarmProp.alarmName}`, alarmArn)
        alarms.push(alarm)
      })
    }

    return alarms
  }
}
