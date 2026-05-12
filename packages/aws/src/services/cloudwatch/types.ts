import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import * as logs from 'aws-cdk-lib/aws-logs'

import { TagProps } from '../../types/index.js'

/**
 * Props for creating a CloudWatch alarm, supporting both metric-based and math-expression-based alarms.
 * @see {@link CloudWatchManager.createAlarmForMetric}
 * @see {@link CloudWatchManager.createAlarmForExpression}
 */
/** @category Interface */
export interface AlarmProps extends watch.AlarmProps {
  /** A math expression string referencing metrics (e.g. "m0 + m1") */
  expression?: string
  /** Array of metric properties used in a math expression alarm */
  metricProps?: MetricProps[]
  /** The evaluation period in seconds (defaults to 5 minutes) */
  periodInSecs?: number
}

/**
 * Props for creating a CloudWatch dashboard.
 * @see {@link CloudWatchManager.createDashboard}
 */
/** @category Interface */
export interface DashboardProps extends watch.DashboardProps {}

/**
 * Props for defining a CloudWatch metric with service-specific dimension support.
 * @see {@link CloudWatchManager}
 */
/** @category Interface */
export interface MetricProps extends watch.MetricProps {
  /** The API Gateway API name dimension */
  apiName?: string
  /** The ElastiCache cluster ID dimension */
  cacheClusterId?: string
  /** The ECS cluster name dimension */
  clusterName?: string
  /** The RDS DB cluster identifier dimension */
  dbClusterIdentifier?: string
  /** The CloudFront distribution ID dimension */
  distributionId?: string
  /** The EventBridge event bus name dimension */
  eventBusName?: string
  /** The Lambda function name dimension */
  functionName?: string
  /** The ELB load balancer reference dimension */
  loadBalancer?: string
  /** The metric period in seconds (defaults to 5 minutes) */
  periodInSecs?: number
  /** The EventBridge rule name dimension */
  ruleName?: string
  /** A custom service identifier dimension */
  service?: string
  /** The ECS service name dimension */
  serviceName?: string
  /** Whether to append the deployment stage to the metric name and namespace */
  stageSuffix: boolean
  /** The Step Functions state machine ARN dimension */
  stateMachineArn?: string
}

/**
 * Props for creating a CloudWatch text widget with positioning.
 * @see {@link CloudWatchManager.createTextWidget}
 */
/** @category Interface */
export interface TextWidgetProps extends watch.TextWidgetProps {
  /** The X position of the widget on the dashboard grid */
  positionX: number
  /** The Y position of the widget on the dashboard grid */
  positionY: number
  /** The widget type identifier */
  type: string
}

/**
 * Props for creating a CloudWatch single-value numeric widget with positioning.
 * @see {@link CloudWatchManager.createSingleValueWidget}
 */
/** @category Interface */
export interface NumericWidgetProps extends watch.SingleValueWidgetProps {
  /** Array of metric properties to display in the widget */
  metricProps: watch.MetricProps[]
  /** The X position of the widget on the dashboard grid */
  positionX: number
  /** The Y position of the widget on the dashboard grid */
  positionY: number
  /** The widget type identifier */
  type: string
}

/**
 * Props for creating a CloudWatch gauge widget with positioning.
 * @see {@link CloudWatchManager.createGuageWidget}
 */
/** @category Interface */
export interface GuageWidgetProps extends watch.GaugeWidgetProps {
  /** Array of metric properties to display in the widget */
  metricProps: watch.MetricProps[]
  /** The X position of the widget on the dashboard grid */
  positionX: number
  /** The Y position of the widget on the dashboard grid */
  positionY: number
  /** The widget type identifier */
  type: string
}

/**
 * Props for creating a CloudWatch graph widget with positioning.
 * @see {@link CloudWatchManager.createGraphWidget}
 */
/** @category Interface */
export interface GraphWidgetProps extends watch.GraphWidgetProps {
  /** Array of metric properties to plot on the graph */
  metricProps: MetricProps[]
  /** The X position of the widget on the dashboard grid */
  positionX: number
  /** The Y position of the widget on the dashboard grid */
  positionY: number
  /** The widget type identifier */
  type: string
}

/**
 * Props for creating a CloudWatch alarm status widget with positioning.
 * @see {@link CloudWatchManager.createAlarmStatusWidget}
 */
/** @category Interface */
export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  /** Array of alarm properties to display in the widget */
  alarmProps: watch.AlarmProps[]
  /** The X position of the widget on the dashboard grid */
  positionX: number
  /** The Y position of the widget on the dashboard grid */
  positionY: number
  /** The widget type identifier */
  type: string
}

/**
 * Props for creating a CloudWatch log query widget with positioning.
 * @see {@link CloudWatchManager.createLogQueryWidget}
 */
/** @category Interface */
export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  /** The X position of the widget on the dashboard grid */
  positionX: number
  /** The Y position of the widget on the dashboard grid */
  positionY: number
  /** The widget type identifier */
  type: string
}

/**
 * Props for creating a CloudWatch metric filter with metric options.
 * @see {@link LogManager.createMetricFilter}
 */
/** @category Interface */
export interface MetricFilterProps extends logs.MetricFilterProps {
  /** The metric options applied when retrieving the metric from the filter */
  options: watch.MetricOptions
  /** The metric period in seconds (defaults to 5 minutes) */
  periodInSecs: number
}

/**
 * Props for creating a CloudWatch log group with optional tags.
 * @see {@link LogManager.createLogGroup}
 * @see {@link LogManager.createCfnLogGroup}
 */
/** @category Interface */
export interface LogProps extends logs.LogGroupProps {
  /** Optional tags to apply to the log group */
  tags?: TagProps[]
}
