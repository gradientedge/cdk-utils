import * as wafv2 from '@aws-cdk/aws-wafv2'
import * as ec2 from '@aws-cdk/aws-ec2'
import * as appconfig from '@aws-cdk/aws-appconfig'
import * as sns from '@aws-cdk/aws-sns'
import * as s3 from '@aws-cdk/aws-s3'
import * as route53 from '@aws-cdk/aws-route53'
import * as logs from '@aws-cdk/aws-logs'
import * as watch from '@aws-cdk/aws-cloudwatch'
import * as lambda from '@aws-cdk/aws-lambda'
import * as events from '@aws-cdk/aws-events'
import * as eks from '@aws-cdk/aws-eks'
import * as ecs from '@aws-cdk/aws-ecs'
import * as cloudtrail from '@aws-cdk/aws-cloudtrail'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cdk from '@aws-cdk/core'

/**
 *
 */
export enum CloudWatchWidgetType {
  Text = 'Text',
  SingleValue = 'SingleValue',
  Graph = 'Graph',
  AlarmStatus = 'AlarmStatus',
  LogQuery = 'LogQuery',
}

/**
 *
 */
export interface AppConfigProps {
  id: string
  application: appconfig.CfnApplicationProps
  configurationProfile: appconfig.CfnConfigurationProfileProps
  deployment: appconfig.CfnDeploymentProps
  deploymentStrategy: appconfig.CfnDeploymentStrategyProps
  environment: appconfig.CfnEnvironmentProps
}

/**
 *
 */
export interface CommonStackProps extends cdk.StackProps {
  name: string
  region: string
  stage: string
  domainName: string
  subDomain?: string
  extraContexts?: string[]
  routes?: Route53Props[]
  appConfigs?: AppConfigProps[]
  buckets?: S3BucketProps[]
  certificates?: AcmProps[]
  distributions?: CloudFrontProps[]
  logs?: LogProps[]
  rules?: RuleProps[]
  trails?: CloudTrailProps[]
  vpc?: ec2.VpcProps
  ecsClusters?: EcsClusterProps[]
  ecsTasks?: EcsTaskProps[]
  eksClusters?: EksClusterProps[]
  lambdas?: LambdaProps[]
  subscriptions?: SubscriptionProps[]
  dashboards?: DashboardProps[]
  widgets?: any[]
  metricFilters?: MetricFilterProps[]
  alarms?: AlarmProps[]
  wafIpSets?: WafIPSetProps[]
  wafWebAcls?: WafWebACLProps[]
}

/**
 *
 */
export interface AcmProps extends acm.CertificateProps {
  id: string
  certificateAccount?: string
  certificateRegion?: string
  certificateId: string
}

/**
 *
 */
export interface CloudFrontProps extends cloudfront.CloudFrontWebDistributionProps {
  id?: string
}

/**
 *
 */
export interface CloudTrailProps extends cloudtrail.CfnTrailProps {
  id: string
}

/**
 *
 */
export interface DashboardProps extends watch.DashboardProps {
  id: string
  positionX: number
  positionY: number
}

/**
 *
 */
export interface AlarmProps extends watch.AlarmProps {
  id: string
  expression?: string
  metricProps?: MetricProps[]
  periodInSecs?: number
}

/**
 *
 */
export interface MetricProps extends watch.MetricProps {
  stageSuffix: boolean
  periodInSecs?: number
  functionName?: string
  dbClusterIdentifier?: string
}

/**
 *
 */
export interface TextWidgetProps extends watch.TextWidgetProps {
  id: string
  positionX: number
  positionY: number
}

/**
 *
 */
export interface NumericWidgetProps extends watch.SingleValueWidgetProps {
  id: string
  positionX: number
  positionY: number
  metricProps?: watch.MetricProps[]
}

/**
 *
 */
export interface GraphWidgetProps extends watch.GraphWidgetProps {
  id: string
  positionX: number
  positionY: number
  metricProps?: MetricProps[]
}

/**
 *
 */
export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  id: string
  positionX: number
  positionY: number
  alarmProps?: watch.AlarmProps[]
}

/**
 *
 */
export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  id: string
  positionX: number
  positionY: number
}

/**
 *
 */
export interface EcsClusterProps extends ecs.ClusterProps {
  id: string
}

/**
 *
 */
export interface EcsTaskProps extends ecs.TaskDefinitionProps {
  id: string
}

/**
 *
 */
export interface EksClusterProps extends eks.ClusterProps {
  id: string
  appContainerPort: number
  appCapacity: number
}

/**
 *
 */
export interface RuleProps extends events.CfnRuleProps {
  id: string
}

/**
 *
 */
export interface LambdaProps extends lambda.FunctionProps {
  id: string
  timeoutInSecs?: number
}

/**
 *
 */
export interface LogProps extends logs.CfnLogGroupProps {
  id: string
}

/**
 *
 */
export interface MetricFilterProps extends logs.MetricFilterProps {
  id: string
  periodInSecs: number
  options: watch.MetricOptions
}

/**
 *
 */
export interface Route53Props extends route53.HostedZoneProps {
  id: string
  existingHostedZone?: boolean
}

/**
 *
 */
export interface S3BucketProps extends s3.BucketProps {
  id: string
  bucketName: string
  logBucketName?: string
  existingBucket?: boolean
}

/**
 *
 */
export interface SubscriptionProps extends sns.TopicProps {
  id: string
}

/**
 *
 */
export interface WafIPSetProps extends wafv2.CfnIPSetProps {
  id: string
}

/**
 *
 */
export interface WafWebACLProps extends wafv2.CfnWebACLProps {
  id: string
}
