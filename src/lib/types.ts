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
 * @category Management & Governance
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
 * @category Constructs
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
 * @category Security, Identity & Compliance
 */
export interface AcmProps extends acm.CertificateProps {
  id: string
  certificateAccount?: string
  certificateRegion?: string
  certificateId: string
}

/**
 * @category Networking & Content Delivery
 */
export interface CloudFrontProps extends cloudfront.CloudFrontWebDistributionProps {
  id?: string
}

/**
 * @category Management & Governance
 */
export interface CloudTrailProps extends cloudtrail.CfnTrailProps {
  id: string
}

/**
 * @category Management & Governance
 */
export interface DashboardProps extends watch.DashboardProps {
  id: string
  positionX: number
  positionY: number
}

/**
 * @category Management & Governance
 */
export interface AlarmProps extends watch.AlarmProps {
  id: string
  expression?: string
  metricProps?: MetricProps[]
  periodInSecs?: number
}

/**
 * @category Management & Governance
 */
export interface MetricProps extends watch.MetricProps {
  stageSuffix: boolean
  periodInSecs?: number
  functionName?: string
  dbClusterIdentifier?: string
}

/**
 * @category Management & Governance
 */
export interface TextWidgetProps extends watch.TextWidgetProps {
  id: string
  positionX: number
  positionY: number
}

/**
 * @category Management & Governance
 */
export interface NumericWidgetProps extends watch.SingleValueWidgetProps {
  id: string
  positionX: number
  positionY: number
  metricProps?: watch.MetricProps[]
}

/**
 * @category Management & Governance
 */
export interface GraphWidgetProps extends watch.GraphWidgetProps {
  id: string
  positionX: number
  positionY: number
  metricProps?: MetricProps[]
}

/**
 * @category Management & Governance
 */
export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  id: string
  positionX: number
  positionY: number
  alarmProps?: watch.AlarmProps[]
}

/**
 * @category Management & Governance
 */
export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  id: string
  positionX: number
  positionY: number
}

/**
 * @category Containers
 */
export interface EcsClusterProps extends ecs.ClusterProps {
  id: string
}

/**
 * @category Containers
 */
export interface EcsTaskProps extends ecs.TaskDefinitionProps {
  id: string
}

/**
 * @category Containers
 */
export interface EksClusterProps extends eks.ClusterProps {
  id: string
  appContainerPort: number
  appCapacity: number
}

/**
 * @category Application Integration
 */
export interface RuleProps extends events.CfnRuleProps {
  id: string
}

/**
 * @category Compute
 */
export interface LambdaProps extends lambda.FunctionProps {
  id: string
  timeoutInSecs?: number
}

/**
 * @category Management & Governance
 */
export interface LogProps extends logs.CfnLogGroupProps {
  id: string
}

/**
 * @category Management & Governance
 */
export interface MetricFilterProps extends logs.MetricFilterProps {
  id: string
  periodInSecs: number
  options: watch.MetricOptions
}

/**
 * @category Networking & Content Delivery
 */
export interface Route53Props extends route53.HostedZoneProps {
  id: string
  existingHostedZone?: boolean
}

/**
 * @category Storage
 */
export interface S3BucketProps extends s3.BucketProps {
  id: string
  bucketName: string
  logBucketName?: string
  existingBucket?: boolean
}

/**
 * @category Application Integration
 */
export interface SubscriptionProps extends sns.TopicProps {
  id: string
}

/**
 * @category Security, Identity & Compliance
 */
export interface WafIPSetProps extends wafv2.CfnIPSetProps {
  id: string
}

/**
 * @category Security, Identity & Compliance
 */
export interface WafWebACLProps extends wafv2.CfnWebACLProps {
  id: string
}
