import * as wafv2 from 'aws-cdk-lib/aws-wafv2'
import * as appconfig from 'aws-cdk-lib/aws-appconfig'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as events from 'aws-cdk-lib/aws-events'
import * as eks from 'aws-cdk-lib/aws-eks'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cdk from 'aws-cdk-lib'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'

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
  stageContextPath?: string
}

export interface SiteWithEcsBackendProps extends CommonStackProps {
  siteCacheInvalidationDockerFilePath?: string
  siteHealthCheck: HealthCheck
  siteCertificate: AcmProps
  siteCluster: EcsClusterProps
  siteDistribution: DistributionProps
  siteEcsContainerImagePath: string
  siteLog: LogProps
  siteLogBucket: S3BucketProps
  siteRecordName?: string
  siteSubDomain: string
  siteTask: ecsPatterns.ApplicationLoadBalancedFargateServiceProps
  siteVpc: ec2.VpcProps
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}

export interface StaticSiteProps extends CommonStackProps {
  siteCreateAltARecord: boolean
  siteCertificate: AcmProps
  siteBucket: S3BucketProps
  siteLogBucket: S3BucketProps
  siteDistribution?: DistributionProps
  siteSource: s3deploy.ISource
  siteHostedZoneDomainName?: string
  siteRecordName?: string
  siteSubDomain?: string
  siteAliases?: string[]
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}

export interface HealthCheck extends elb.HealthCheck {
  intervalInSecs: number
  timeoutInSecs: number
}

export interface GraphQlApiLambdaEnvironment {
  NODE_ENV: string
  LOG_LEVEL: string
  TZ: string
}

export interface GraphQlApiLambdaProps extends CommonStackProps {
  apiRootPaths: string[]
  apiSubDomain: string
  graphQLApiCertificate: AcmProps
  graphqlRestApi: apig.LambdaRestApiProps
  graphqlApiLambdaLayerSources?: lambda.AssetCode[]
  graphQLApiHandler: string
  graphQLApiSource: lambda.AssetCode
  graphqlApi: LambdaProps
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}

/**
 * @category Security, Identity & Compliance
 */
export interface AcmProps extends acm.CertificateProps {
  certificateSsmName?: string
  certificateAccount?: string
  certificateRegion?: string
  certificateId?: string
  certificateArn?: string
  useExistingCertificate: boolean
}

/**
 * @category Management & Governance
 */
export interface SSMParameterReaderProps {
  parameterName: string
  region: string
}

/**
 * @category Networking & Content Delivery
 */
export interface CloudFrontProps extends cloudfront.CloudFrontWebDistributionProps {}

/**
 * @category Networking & Content Delivery
 */
export interface DistributionProps extends cloudfront.DistributionProps {}

/**
 * @category Management & Governance
 */
export interface CloudTrailProps extends cloudtrail.CfnTrailProps {}

/**
 * @category Management & Governance
 */
export interface DashboardProps extends watch.DashboardProps {
  positionX: number
  positionY: number
}

/**
 * @category Management & Governance
 */
export interface AlarmProps extends watch.AlarmProps {
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
  positionX: number
  positionY: number
}

/**
 * @category Management & Governance
 */
export interface NumericWidgetProps extends watch.SingleValueWidgetProps {
  positionX: number
  positionY: number
  metricProps?: watch.MetricProps[]
}

/**
 * @category Management & Governance
 */
export interface GraphWidgetProps extends watch.GraphWidgetProps {
  positionX: number
  positionY: number
  metricProps?: MetricProps[]
}

/**
 * @category Management & Governance
 */
export interface AlarmStatusWidgetProps extends watch.AlarmStatusWidgetProps {
  positionX: number
  positionY: number
  alarmProps?: watch.AlarmProps[]
}

/**
 * @category Management & Governance
 */
export interface LogQueryWidgetProps extends watch.LogQueryWidgetProps {
  positionX: number
  positionY: number
}

/**
 * @category Containers
 */
export interface EcsClusterProps extends ecs.ClusterProps {}

/**
 * @category Containers
 */
export interface EcsTaskProps extends ecs.TaskDefinitionProps {}

/**
 * @category Containers
 */
export interface EksClusterProps extends eks.ClusterProps {
  appContainerPort: number
  appCapacity: number
}

/**
 * @category Application Integration
 */
export interface RuleProps extends events.CfnRuleProps {}

/**
 * @category Compute
 */
export interface LambdaProps extends lambda.FunctionProps {
  timeoutInSecs?: number
}

/**
 * @category Compute
 */
export interface LambdaEdgeProps extends cloudfront.experimental.EdgeFunctionProps {
  timeoutInSecs?: number
}

/**
 * @category Management & Governance
 */
export interface LogProps extends logs.LogGroupProps {}

/**
 * @category Management & Governance
 */
export interface MetricFilterProps extends logs.MetricFilterProps {
  periodInSecs: number
  options: watch.MetricOptions
}

/**
 * @category Networking & Content Delivery
 */
export interface Route53Props extends route53.HostedZoneProps {
  useExistingHostedZone?: boolean
}

/**
 * @category Storage
 */
export interface S3BucketProps extends s3.BucketProps {
  bucketName: string
  logBucketName?: string
  existingBucket?: boolean
}

/**
 * @category Application Integration
 */
export interface SubscriptionProps extends sns.TopicProps {}

/**
 * @category Security, Identity & Compliance
 */
export interface WafIPSetProps extends wafv2.CfnIPSetProps {}

/**
 * @category Security, Identity & Compliance
 */
export interface WafWebACLProps extends wafv2.CfnWebACLProps {}
