import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import * as logs from 'aws-cdk-lib/aws-logs'

import { TagProps } from '../../types/index.js'

/**
 */
/** @category Interface */
export interface AlarmProps extends watch.AlarmProps {
  expression?: string
  metricProps?: MetricProps[]
  periodInSecs?: number
}

/**
 */
/** @category Interface */
export interface DashboardProps extends watch.DashboardProps {}

/**
 */
/** @category Interface */
export interface MetricProps extends watch.MetricProps {
  apiName?: string
  cacheClusterId?: string
  clusterName?: string
  dbClusterIdentifier?: string
  distributionId?: string
  eventBusName?: string
  functionName?: string
  loadBalancer?: string
  periodInSecs?: number
  ruleName?: string
  service?: string
  serviceName?: string
  stageSuffix: boolean
  stateMachineArn?: string
}

/**
 */
/** @category Interface */
export interface TextWidgetProps extends watch.TextWidgetProps {
  positionX: number
  positionY: number
  type: string
}

/**
 */
/** @category Interface */
export interface NumericWidgetProps extends watch.SingleValueWidgetProps {
  metricProps: watch.MetricProps[]
  positionX: number
  positionY: number
  type: string
}

/**
 */
/** @category Interface */
export interface GuageWidgetProps extends watch.GaugeWidgetProps {
  metricProps: watch.MetricProps[]
  positionX: number
  positionY: number
  type: string
}

/**
 */
/** @category Interface */
export interface GraphWidgetProps extends watch.GraphWidgetProps {
  metricProps: MetricProps[]
  positionX: number
  positionY: number
  type: string
}

/**
 */
/** @category Interface */
export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  alarmProps: watch.AlarmProps[]
  positionX: number
  positionY: number
  type: string
}

/**
 */
/** @category Interface */
export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  positionX: number
  positionY: number
  type: string
}

/**
 */
/** @category Interface */
export interface MetricFilterProps extends logs.MetricFilterProps {
  options: watch.MetricOptions
  periodInSecs: number
}

/**
 */
/** @category Interface */
export interface LogProps extends logs.LogGroupProps {
  tags?: TagProps[]
}
