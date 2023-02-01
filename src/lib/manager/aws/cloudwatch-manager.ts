import * as cdk from 'aws-cdk-lib'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import { IMetric } from 'aws-cdk-lib/aws-cloudwatch'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Construct
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
 *     this.cloudWatchManager.createAlarmForMetric('MyAlarm', this, metric)
 *   }
 * }
 *
 * @see [CDK CloudWatch Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudwatch-readme.html}
 */
export class CloudWatchManager {
  /**
   * @summary Method to create a cloudwatch alarm for a given expression
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.AlarmProps} props
   */
  public createAlarmForExpression(id: string, scope: common.CommonConstruct, props: types.AlarmProps) {
    if (!props) throw `Alarm props undefined for ${id}`

    if (!props.expression) throw `Could not find expression for Alarm props for id:${id}`
    if (!props.metricProps) throw `Could not find metricProps for Alarm props for id:${id}`

    const metrics: any = {}
    this.determineMetrics(scope, props.metricProps).map(
      (metric: watch.IMetric, index: number) => (metrics[`m${index}`] = metric)
    )
    const expression = new watch.MathExpression({
      expression: props.expression,
      usingMetrics: metrics,
      period: props.periodInSecs ? cdk.Duration.seconds(props.periodInSecs) : cdk.Duration.minutes(5),
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

    utils.createCfnOutput(`${id}-alarmArn`, scope, alarm.alarmArn)
    utils.createCfnOutput(`${id}-alarmName`, scope, alarm.alarmName)

    return alarm
  }

  /**
   * @summary Method to create a cloudwatch alarm for a given metric
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.AlarmProps} props
   * @param metric
   */
  public createAlarmForMetric(
    id: string,
    scope: common.CommonConstruct,
    props: types.AlarmProps,
    metric: watch.Metric
  ) {
    if (!props) throw `Alarm props undefined for ${id}`

    const alarm = metric.createAlarm(scope, `${id}`, {
      alarmName: props.alarmName,
      alarmDescription: props.alarmDescription,
      threshold: props.threshold,
      evaluationPeriods: props.evaluationPeriods,
      comparisonOperator: props.comparisonOperator,
      treatMissingData: props.treatMissingData,
      datapointsToAlarm: props.datapointsToAlarm,
    })

    utils.createCfnOutput(`${id}-alarmArn`, scope, alarm.alarmArn)
    utils.createCfnOutput(`${id}-alarmName`, scope, alarm.alarmName)

    return alarm
  }

  /**
   * @summary Method to create a cloudwatch dashboard
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.DashboardProps} props
   * @param widgets
   */
  public createDashboard(
    id: string,
    scope: common.CommonConstruct,
    props: types.DashboardProps,
    widgets?: watch.IWidget[][]
  ) {
    if (!props) throw `Dashboard props undefined for ${id}`

    const dashboard = new watch.Dashboard(scope, `${id}`, {
      dashboardName: props.dashboardName,
      periodOverride: props.periodOverride,
      start: CloudWatchManager.determineTimeRange(props.start),
      end: CloudWatchManager.determineTimeRange(props.end),
      widgets: widgets,
    })

    utils.createCfnOutput(`${id}-dashboardName`, scope, props.dashboardName)

    return dashboard
  }

  /**
   * @summary Method to create cloudwatch widgets
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param props
   */
  public createWidgets(scope: common.CommonConstruct, props: any[]) {
    if (!props || props.length == 0) throw `Widget props undefined`

    const widgets: any = []
    props.forEach((widgetProps: any) => widgets.push(this.createWidget(widgetProps.id, scope, widgetProps)))

    return widgets
  }

  /**
   * @summary Method to create a cloudwatch widget
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param props
   */
  public createWidget(id: string, scope: common.CommonConstruct, props: any) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} distributionId the cloudfront distribution id
   */
  public createCloudfrontDistributionWidget(
    id: string,
    scope: common.CommonConstruct,
    props: any,
    distributionId: string
  ) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} stateMachineArn the step function arn
   */
  public createStateWidget(id: string, scope: common.CommonConstruct, props: any, stateMachineArn: string) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} eventBusName the event bus name
   * @param {string} ruleName the event rule name
   */
  public createEventWidget(
    id: string,
    scope: common.CommonConstruct,
    props: any,
    eventBusName: string,
    ruleName: string
  ) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} apiName the api name
   */
  public createApiGatewayWidget(id: string, scope: common.CommonConstruct, props: any, apiName: string) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} functionName the lambda function name
   */
  public createLambdaWidget(id: string, scope: common.CommonConstruct, props: any, functionName: string) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} service the service identifier
   */
  public createCustomWidget(id: string, scope: common.CommonConstruct, props: any, service: string) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} clusterName the ecs cluster name
   */
  public createEcsClusterWidget(id: string, scope: common.CommonConstruct, props: any, clusterName: string) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} clusterName the ecs cluster name
   * @param {string} serviceName the ecs service name
   */
  public createEcsServiceWidget(
    id: string,
    scope: common.CommonConstruct,
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} loadBalancer the loadbalancer reference
   */
  public createElbWidget(id: string, scope: common.CommonConstruct, props: any, loadBalancer: string) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   * @param {string} cacheClusterId the elasticache cluster id
   */
  public createCacheWidget(id: string, scope: common.CommonConstruct, props: any, cacheClusterId: string) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.TextWidgetProps} props
   */
  public createTextWidget(id: string, scope: common.CommonConstruct, props: types.TextWidgetProps) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.TextWidget({
      markdown: props.markdown,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch numeric widget
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.NumericWidgetProps} props
   * @param metrics
   */
  public createSingleValueWidget(
    id: string,
    scope: common.CommonConstruct,
    props: types.NumericWidgetProps,
    metrics: IMetric[]
  ) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.SingleValueWidget({
      region: props.region ?? scope.props.region,
      metrics: metrics,
      setPeriodToTimeRange: props.setPeriodToTimeRange,
      fullPrecision: props.fullPrecision,
      sparkline: props.sparkline,
      title: props.title,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch guage widget
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.GuageWidgetProps} props
   * @param metrics
   */
  public createGuageWidget(
    id: string,
    scope: common.CommonConstruct,
    props: types.GuageWidgetProps,
    metrics: IMetric[]
  ) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.GaugeWidget({
      region: props.region ?? scope.props.region,
      metrics: metrics,
      leftYAxis: props.leftYAxis,
      statistic: props.statistic,
      setPeriodToTimeRange: props.setPeriodToTimeRange,
      title: props.title,
      width: props.width,
      height: props.height,
    })

    if (props.positionX && props.positionY) widget.position(props.positionX, props.positionY)

    return widget
  }

  /**
   * @summary Method to create a cloudwatch graph widget
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.GraphWidgetProps} props
   * @param leftYMetrics
   * @param rightYMetrics
   */
  public createGraphWidget(
    id: string,
    scope: common.CommonConstruct,
    props: types.GraphWidgetProps,
    leftYMetrics?: IMetric[],
    rightYMetrics?: IMetric[]
  ) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.GraphWidget({
      region: props.region ?? scope.props.region,
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
   * @summary Method to create a cloudwatch alarm status widget
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.AlarmStatusWidgetProps} props
   * @param {watch.IAlarm[]} alarms
   */
  public createAlarmStatusWidget(
    id: string,
    scope: common.CommonConstruct,
    props: types.AlarmStatusWidgetProps,
    alarms: watch.IAlarm[]
  ) {
    if (!props) throw `Widget props undefined for ${id}`
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
   * @summary Method to create a cloudwatch log query widget
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LogQueryWidgetProps} props
   * @param {string[]} logGroupNames
   */
  public createLogQueryWidget(
    id: string,
    scope: common.CommonConstruct,
    props: types.LogQueryWidgetProps,
    logGroupNames: string[]
  ) {
    if (!props) throw `Widget props undefined for ${id}`
    const widget = new watch.LogQueryWidget({
      region: props.region ?? scope.props.region,
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
   * @summary Utility method to determine the metrics and dimensions
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.MetricProps[]} metricProps
   */
  private determineMetrics(scope: common.CommonConstruct, metricProps: types.MetricProps[]) {
    const metrics: watch.IMetric[] = []
    if (metricProps) {
      metricProps.forEach((metricProp: types.MetricProps) => {
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
              ServiceName: `${metricProp.serviceName}`,
              ClusterName: `${metricProp.clusterName}`,
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
              Region: `Global`,
              DistributionId: `${metricProp.distributionId}`,
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
          namespace: metricProp.stageSuffix ? `${metricProp.namespace}-${scope.props.stage}` : metricProp.namespace,
          metricName: metricProp.stageSuffix ? `${metricProp.metricName}-${scope.props.stage}` : metricProp.metricName,
          dimensionsMap: metricDimensions,
          statistic: metricProp.statistic,
          region: metricProp.region,
          period: metricProp.periodInSecs ? cdk.Duration.seconds(metricProp.periodInSecs) : cdk.Duration.minutes(5),
        })
        metrics.push(metric)
      })
    }

    return metrics
  }

  /**
   * @summary Utility method to determine the time range
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
   * @summary Utility method to determine the configured alarms
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {watch.AlarmProps[]} alarmProps
   */
  private determineAlarms(id: string, scope: common.CommonConstruct, alarmProps: watch.AlarmProps[]) {
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
