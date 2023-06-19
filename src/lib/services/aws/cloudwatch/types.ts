import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import * as logs from 'aws-cdk-lib/aws-logs'
import { TagProps } from '../../../types'

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface AlarmProps extends watch.AlarmProps {
  expression?: string
  metricProps?: MetricProps[]
  periodInSecs?: number
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface DashboardProps extends watch.DashboardProps {}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface MetricProps extends watch.MetricProps {
  stageSuffix: boolean
  periodInSecs?: number
  functionName?: string
  dbClusterIdentifier?: string
  distributionId?: string
  loadBalancer?: string
  serviceName?: string
  clusterName?: string
  apiName?: string
  cacheClusterId?: string
  stateMachineArn?: string
  eventBusName?: string
  ruleName?: string
  service?: string
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface TextWidgetProps extends watch.TextWidgetProps {
  type: string
  positionX: number
  positionY: number
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface NumericWidgetProps extends watch.SingleValueWidgetProps {
  type: string
  positionX: number
  positionY: number
  metricProps: watch.MetricProps[]
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface GuageWidgetProps extends watch.GaugeWidgetProps {
  type: string
  positionX: number
  positionY: number
  metricProps: watch.MetricProps[]
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface GraphWidgetProps extends watch.GraphWidgetProps {
  type: string
  positionX: number
  positionY: number
  metricProps: MetricProps[]
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  type: string
  positionX: number
  positionY: number
  alarmProps: watch.AlarmProps[]
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  type: string
  positionX: number
  positionY: number
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface MetricFilterProps extends logs.MetricFilterProps {
  periodInSecs: number
  options: watch.MetricOptions
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface LogProps extends logs.LogGroupProps {
  tags?: TagProps[]
}
