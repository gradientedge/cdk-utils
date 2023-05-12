import * as cdk from 'aws-cdk-lib'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as appconfig from 'aws-cdk-lib/aws-appconfig'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as eks from 'aws-cdk-lib/aws-eks'
import * as elasticache from 'aws-cdk-lib/aws-elasticache'
import * as elb from 'aws-cdk-lib/aws-elasticloadbalancingv2'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as events from 'aws-cdk-lib/aws-events'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as kms from 'aws-cdk-lib/aws-kms'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as sfn from 'aws-cdk-lib/aws-stepfunctions'
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks'
import * as wafv2 from 'aws-cdk-lib/aws-wafv2'
import * as types from '../index'
import * as appAutoscaling from 'aws-cdk-lib/aws-applicationautoscaling'

/**
 * @category cdk-utils.app-config-manager
 * @subcategory Properties
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
 * @category cdk-utils.common-stack
 * @subcategory Properties
 */
export interface CommonStackProps extends cdk.StackProps {
  name: string
  region: string
  stage: string
  domainName: string
  subDomain?: string
  extraContexts?: string[]
  stageContextPath?: string
  skipStageForARecords: boolean
  logRetention?: logs.RetentionDays
  defaultReservedLambdaConcurrentExecutions?: number
  excludeDomainNameForBuckets?: boolean
  nodejsRuntime?: lambda.Runtime
}

/**
 * @category cdk-utils.site-with-ecs-backend
 * @subcategory Properties
 */
export interface SiteWithEcsBackendProps extends CommonStackProps {
  siteCacheInvalidationDockerFilePath?: string
  siteHealthCheck: HealthCheck
  siteCertificate: AcmProps
  siteCluster: EcsClusterProps
  siteDistribution: DistributionProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteFunctionFilePath?: string
  siteEcsContainerImagePath: string
  siteLog: LogProps
  siteLogBucket: S3BucketProps
  siteRecordName?: string
  siteSubDomain: string
  siteTask: EcsApplicationLoadBalancedFargateServiceProps
  siteVpc: ec2.VpcProps
  siteFileSystem?: EfsFileSystemProps
  siteFileSystemAccessPoints?: EfsAccessPointOptions[]
  useExistingHostedZone: boolean
  nodeEnv: string
  logLevel: string
  timezone: string
}

/**
 * @category cdk-utils.static-site
 * @subcategory Properties
 */
export interface StaticSiteProps extends CommonStackProps {
  siteCacheInvalidationDockerFilePath?: string
  siteCreateAltARecord: boolean
  siteCertificate: AcmProps
  siteBucket: S3BucketProps
  siteLogBucket: S3BucketProps
  siteDistribution?: DistributionProps
  siteCloudfrontFunctionProps?: CloudfrontFunctionProps
  siteFunctionFilePath?: string
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

/**
 * @category cdk-utils.site-with-ecs-backend
 * @subcategory Properties
 */
export interface HealthCheck extends elb.HealthCheck {
  intervalInSecs: number
  timeoutInSecs: number
}

/**
 * @category cdk-utils.kms-manager
 * @subcategory Properties
 */
export interface KmsKeyProps extends kms.KeyProps {}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnSucceedProps extends sfn.SucceedProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnRetryProps extends sfn.RetryProps {
  intervalInSecs: number
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnFailProps extends sfn.FailProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnPassProps extends sfn.PassProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnDynamoGetItemProps extends tasks.DynamoGetItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnDynamoPutItemProps extends tasks.DynamoPutItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnDynamoDeleteItemProps extends tasks.DynamoDeleteItemProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnSqsSendMessageProps extends tasks.SqsSendMessageProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnParallelProps extends sfn.ParallelProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnChoiceProps extends sfn.ChoiceProps {
  name: string
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnWaitProps extends sfn.WaitProps {
  name: string
  delayInSeconds: number
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnLambdaInvokeProps extends tasks.LambdaInvokeProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnCallApiGatewayRestApiEndpointProps extends tasks.CallApiGatewayRestApiEndpointProps {
  name: string
  retries?: SfnRetryProps[]
}

/**
 * @category cdk-utils.step-functions-manager
 * @subcategory Properties
 */
export interface SfnStateMachineProps extends sfn.StateMachineProps {}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Types
 */
export interface LambdaEnvironment {
  NODE_ENV: string
  LOG_LEVEL: string
  REGION?: string
  STAGE?: string
  TZ: string
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
 */
export interface ApiDestinedLambdaEnvironment extends LambdaEnvironment {
  SOURCE_ID: string
}

/**
 * @category cdk-utils.graphql-api-lambda
 * @subcategory Types
 */
export interface GraphQlApiLambdaEnvironment extends LambdaEnvironment {}

/**
 * @category cdk-utils.graphql-api-lambda
 * @subcategory Properties
 */
export interface GraphQlApiLambdaProps extends CommonStackProps {
  apiRootPaths?: string[]
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
 * @category cdk-utils.graphql-api-lambda-with-cache
 * @subcategory Properties
 */
export interface GraphQlApiLambdaWithCacheProps extends GraphQlApiLambdaProps {
  graphQLVpc: ec2.VpcProps
  graphQLElastiCache: ReplicatedElastiCacheProps
  securityGroupExportName: string
  useExistingVpc: boolean
  vpcName?: string
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
 */
export interface ApiToEventBridgeTargetEventType {
  eventBus: events.IEventBus
  logGroup: logs.LogGroup
  logGroupFailure: logs.LogGroup
  logGroupSuccess: logs.LogGroup
  rule: events.Rule
  ruleFailure: events.Rule
  ruleSuccess: events.Rule
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
 */
export interface ApiToEventBridgeTargetRestApiType {
  api: apig.IRestApi
  authoriser?: apig.IAuthorizer
  certificate: acm.ICertificate
  domain: apig.DomainName
  errorResponseModel: apig.Model
  hostedZone: route53.IHostedZone
  integration: apig.Integration
  integrationErrorResponse: apig.IntegrationResponse
  integrationRequestParameters: { [p: string]: string }
  integrationRequestTemplates: { [p: string]: string }
  integrationResponse: apig.IntegrationResponse
  method: apig.Method
  methodErrorResponse: apig.MethodResponse
  methodResponse: apig.MethodResponse
  resource: apig.Resource
  responseModel: apig.Model
  topic?: sns.ITopic
  role?: iam.Role
  policy?: iam.PolicyDocument
}

/**
 * @category cdk-utils.api-to-lambda-target
 * @subcategory Types
 */
export interface ApiToLambdaTargetRestApiType {
  api: apig.IRestApi
  authoriser?: apig.IAuthorizer
  basePathMappings: apig.BasePathMapping[]
  certificate: acm.ICertificate
  domain: apig.DomainName
  errorResponseModel: apig.Model
  hostedZone: route53.IHostedZone
  integration: apig.Integration
  integrationErrorResponse: apig.IntegrationResponse
  integrationRequestParameters: { [p: string]: string }
  integrationRequestTemplates: { [p: string]: string }
  integrationResponse: apig.IntegrationResponse
  lambda: lambda.IFunction
  method: apig.Method
  methodErrorResponse: apig.MethodResponse
  methodResponse: apig.MethodResponse
  resource: apig.Resource
  responseModel: apig.Model
  topic?: sns.ITopic
  role?: iam.Role
  policy?: iam.PolicyDocument
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
 */
export interface ApiDestinedLambdaType {
  destinationFailure: destinations.EventBridgeDestination
  destinationSuccess: destinations.EventBridgeDestination
  environment: types.ApiDestinedLambdaEnvironment
  function: lambda.IFunction
  layers: lambda.LayerVersion[]
  layerSource?: lambda.AssetCode
  policy: iam.PolicyDocument
  role: iam.Role
  source?: lambda.AssetCode
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
export interface ApiToEventBridgeTargetRestApiProps {
  certificate: AcmProps
  integrationResponse?: apig.IntegrationResponse
  integrationErrorResponse?: apig.IntegrationResponse
  methodResponse?: apig.MethodResponse
  methodErrorResponse?: apig.MethodResponse
  integrationOptions?: apig.IntegrationOptions
  resource: string
  errorResponseModel?: apig.ModelOptions
  responseModel?: apig.ModelOptions
  restApi?: apig.RestApiProps
  importedRestApiRef?: string
  importedRestApiRootResourceRef?: string
  useExisting: boolean
  withResource?: boolean
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
interface ApiToEventBridgeTargetLambdaProps {
  handler?: string
  function: LambdaProps
  source?: lambda.AssetCode
  layerSource?: lambda.AssetCode
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
interface ApiToEventBridgeTargetEventProps {
  eventBusName?: string
  logGroup?: LogProps
  logGroupSuccess?: LogProps
  logGroupFailure?: LogProps
  rule: EventRuleProps
  ruleSuccess: EventRuleProps
  ruleFailure: EventRuleProps
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
export interface ApiToEventBridgeTargetProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  api: ApiToEventBridgeTargetRestApiProps
  event: ApiToEventBridgeTargetEventProps
  lambda?: ApiToEventBridgeTargetLambdaProps
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}

/**
 * @category cdk-utils.api-to-lambda-target
 * @subcategory Properties
 */
export interface ApiToLambdaTargetRestApiProps {
  resource: string
  certificate: AcmProps
  restApi: apig.LambdaRestApiProps
  importedRestApiRef?: string
  importedRestApiRootResourceRef?: string
  useExisting: boolean
  withResource?: boolean
  methodErrorResponse: apig.MethodResponse
  methodResponse: apig.MethodResponse
}

/**
 * @category cdk-utils.api-to-lambda-target
 * @subcategory Properties
 */
export interface ApiToLambdaTargetProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  api: ApiToLambdaTargetRestApiProps
  lambdaFunctionName: string
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}

/**
 * @category cdk-utils.acm-manager
 * @subcategory Properties
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
 * @category cdk-utils.ssm-manager
 * @subcategory Properties
 */
export interface SSMParameterReaderProps {
  parameterName: string
  region: string
}

/**
 * @category cdk-utils.cloudfront-manager
 * @subcategory Properties
 */
export interface CloudFrontProps extends cloudfront.CloudFrontWebDistributionProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.cloudfront-manager
 * @subcategory Properties
 */
export interface CloudfrontFunctionProps extends cloudfront.FunctionProps {
  functionFilePath: string
  eventType: string
}

/**
 * @category cdk-utils.cloudfront-manager
 * @subcategory Properties
 */
export interface DistributionProps extends cloudfront.DistributionProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.cloudtrail-manager
 * @subcategory Properties
 */
export interface CloudTrailProps extends cloudtrail.CfnTrailProps {}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface DashboardProps extends watch.DashboardProps {}

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
 * @category cdk-utils.efs-manager
 * @subcategory Properties
 */
export interface EfsFileSystemProps extends efs.FileSystemProps {
  rootDirectory?: string
  transitEncryption?: string
  transitEncryptionPort?: number
  authorizationConfig?: ecs.AuthorizationConfig
}

/**
 * @category cdk-utils.efs-manager
 * @subcategory Properties
 */
export interface EfsAccessPointOptions extends efs.AccessPointOptions {}

/**
 * @category cdk-utils.ecs-manager
 * @subcategory Properties
 */
export interface EcsClusterProps extends ecs.ClusterProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.ecs-manager
 * @subcategory Properties
 */
export interface EcsTaskProps extends ecs.TaskDefinitionProps {
  logging?: ecs.AwsLogDriverProps
  tags?: TagProps[]
}

export interface EcsScalingProps {
  minCapacity?: number
  maxCapacity?: number
  scaleOnCpuUtilization?: number
  scaleOnMemoryUtilization?: number
  scaleOnRequestsPerTarget?: number
  scaleOnSchedule?: appAutoscaling.ScalingSchedule
}

/**
 * @category cdk-utils.ecs-manager
 * @subcategory Properties
 */
export interface EcsApplicationLoadBalancedFargateServiceProps
  extends ecsPatterns.ApplicationLoadBalancedFargateServiceProps {
  healthCheck?: HealthCheck
  logging?: ecs.AwsLogDriverProps
  mountPoints?: ecs.MountPoint[]
  siteScaling?: EcsScalingProps
}

/**
 * @category cdk-utils.eks-manager
 * @subcategory Properties
 */
export interface EksClusterProps extends eks.ClusterProps {
  appContainerPort: number
  appCapacity: number
}

/**
 * @category cdk-utils.event-manager
 * @subcategory Properties
 */
export interface RuleProps extends events.CfnRuleProps {
  input?: string
}

/**
 * @category cdk-utils.event-manager
 * @subcategory Properties
 */
export interface EventRuleProps extends events.RuleProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.event-manager
 * @subcategory Properties
 */
export interface EventBusProps extends events.EventBusProps {}

/**
 * @category cdk-utils.common-stack
 * @subcategory Properties
 */
export interface TagProps {
  key: string
  value: string
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface ProvisionedConcurrencyProps {
  minCapacity: number
  maxCapacity: number
  utilizationTarget: number
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface LambdaProps extends lambda.FunctionProps {
  dlq?: QueueProps
  redriveq?: QueueProps
  timeoutInSecs?: number
  excludeLastModifiedTimestamp?: boolean
  tags?: TagProps[]
  lambdaAliases?: LambdaAliasProps[]
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface LambdaAliasProps extends lambda.AliasProps {
  provisionedConcurrency?: ProvisionedConcurrencyProps
}

/**
 * @category cdk-utils.lambda-manager
 * @subcategory Properties
 */
export interface LambdaEdgeProps extends cloudfront.experimental.EdgeFunctionProps {
  timeoutInSecs?: number
  tags?: TagProps[]
}

/**
 * @category cdk-utils.api-manager
 * @subcategory Properties
 */
export interface LambdaRestApiProps extends apig.LambdaRestApiProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.cloudwatch-manager
 * @subcategory Properties
 */
export interface LogProps extends logs.LogGroupProps {
  tags?: TagProps[]
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
 * @category cdk-utils.route53-manager
 * @subcategory Properties
 */
export interface Route53Props extends route53.HostedZoneProps {
  useExistingHostedZone?: boolean
}

/**
 * @category cdk-utils.s3-manager
 * @subcategory Properties
 */
export interface LifecycleRule extends s3.LifecycleRule {
  expirationInDays?: number
  noncurrentVersionExpirationInDays?: number
}

/**
 * @category cdk-utils.dynamodb-manager
 * @subcategory Properties
 */
export interface TableProps extends dynamodb.TableProps {
  tags?: TagProps[]
}

/**
 * @category cdk-utils.s3-manager
 * @subcategory Properties
 */
export interface S3BucketProps extends s3.BucketProps {
  enableEventBridge?: boolean
  lifecycleRules?: LifecycleRule[]
  bucketName: string
  logBucketName?: string
  existingBucket?: boolean
  tags?: TagProps[]
}

/**
 * @category cdk-utils.sns-manager
 * @subcategory Properties
 */
export interface SubscriptionProps extends sns.TopicProps {}

/**
 * @category cdk-utils.waf-manager
 * @subcategory Properties
 */
export interface WafIPSetProps extends wafv2.CfnIPSetProps {}

/**
 * @category cdk-utils.waf-manager
 * @subcategory Properties
 */
export interface WafWebACLProps extends wafv2.CfnWebACLProps {}

/**
 * @category cdk-utils.elasticache-manager
 * @category Compute
 */
export interface ElastiCacheProps extends elasticache.CfnCacheClusterProps {}

/**
 * @category cdk-utils.elasticache-manager
 * @category Compute
 */
export interface ReplicatedElastiCacheProps extends elasticache.CfnReplicationGroupProps {}

/**
 * @category cdk-utils.sqs-manager
 * @subcategory Properties
 */
export interface QueueProps extends sqs.QueueProps {
  maxReceiveCount?: number
  visibilityTimeoutInSecs?: number
  receiveMessageWaitTimeInSecs?: number
  dataKeyReuseInSecs?: number
  deliveryDelayInSecs?: number
  retentionInDays?: number
  tags?: TagProps[]
}
