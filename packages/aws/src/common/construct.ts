import { CfnOutput } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '@gradientedge/cdk-utils-common'

import {
  AcmManager,
  ApiManager,
  AppConfigManager,
  CloudFrontManager,
  CloudTrailManager,
  CloudWatchManager,
  CodeBuildManager,
  DynamodbManager,
  EcrManager,
  EcsManager,
  EfsManager,
  EksManager,
  ElastiCacheManager,
  EventManager,
  EventTargetManager,
  EvidentlyManager,
  IamManager,
  KmsManager,
  LambdaManager,
  LogManager,
  Route53Manager,
  S3Manager,
  SecretsManager,
  SfnManager,
  SnsManager,
  SqsManager,
  SsmManager,
  VpcManager,
  WafManager,
} from '../services/index.js'
import { createCfnOutput } from '../utils/index.js'

import { ResourceNameFormatter } from './resource-name-formatter.js'
import { CommonStackProps } from './types.js'

/**
 * Common construct to use as a base for all higher level constructs.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils';
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props);
 *     this.props = props;
 *   };
 * };
 * @category Common
 */
export class CommonConstruct extends Construct {
  /** The common stack properties for the construct */
  props: CommonStackProps
  /** Utility for formatting resource names with prefix/suffix conventions */
  resourceNameFormatter: ResourceNameFormatter
  /** Manager for AWS Certificate Manager operations */
  acmManager: AcmManager
  /** Manager for API Gateway operations */
  apiManager: ApiManager
  /** Manager for AWS AppConfig operations */
  appConfigManager: AppConfigManager
  /** Manager for AWS CodeBuild operations */
  codeBuildManager: CodeBuildManager
  /** Manager for CloudFront distribution operations */
  cloudFrontManager: CloudFrontManager
  /** Manager for CloudTrail operations */
  cloudTrailManager: CloudTrailManager
  /** Manager for CloudWatch operations */
  cloudWatchManager: CloudWatchManager
  /** Manager for DynamoDB operations */
  dynamodbManager: DynamodbManager
  /** Manager for Elastic Container Registry operations */
  ecrManager: EcrManager
  /** Manager for Elastic Container Service operations */
  ecsManager: EcsManager
  /** Manager for Elastic File System operations */
  efsManager: EfsManager
  /** Manager for Elastic Kubernetes Service operations */
  eksManager: EksManager
  /** Manager for ElastiCache operations */
  elasticacheManager: ElastiCacheManager
  /** Manager for EventBridge operations */
  eventManager: EventManager
  /** Manager for EventBridge target operations */
  eventTargetManager: EventTargetManager
  /** Manager for CloudWatch Evidently operations */
  evidentlyManager: EvidentlyManager
  /** Manager for IAM operations */
  iamManager: IamManager
  /** Manager for KMS operations */
  kmsManager: KmsManager
  /** Manager for Lambda operations */
  lambdaManager: LambdaManager
  /** Manager for CloudWatch Logs operations */
  logManager: LogManager
  /** Manager for Route53 operations */
  route53Manager: Route53Manager
  /** Manager for S3 operations */
  s3Manager: S3Manager
  /** Manager for Secrets Manager operations */
  secretsManager: SecretsManager
  /** Manager for Step Functions operations */
  sfnManager: SfnManager
  /** Manager for SNS operations */
  snsManager: SnsManager
  /** Manager for SQS operations */
  sqsManager: SqsManager
  /** Manager for Systems Manager operations */
  ssmManager: SsmManager
  /** Manager for VPC operations */
  vpcManager: VpcManager
  /** Manager for WAF operations */
  wafManager: WafManager

  /** The fully qualified domain name resolved from domainName and subDomain */
  fullyQualifiedDomainName: string

  /**
   * @summary Create a new CommonConstruct
   * @param parent the parent construct
   * @param id scoped id of the resource
   * @param props the common stack properties
   */
  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id)
    this.props = props
    this.resourceNameFormatter = new ResourceNameFormatter(this, `${id}-rnf`, props)
    this.acmManager = new AcmManager()
    this.apiManager = new ApiManager()
    this.appConfigManager = new AppConfigManager()
    this.codeBuildManager = new CodeBuildManager()
    this.cloudFrontManager = new CloudFrontManager()
    this.cloudTrailManager = new CloudTrailManager()
    this.cloudWatchManager = new CloudWatchManager()
    this.dynamodbManager = new DynamodbManager()
    this.ecrManager = new EcrManager()
    this.ecsManager = new EcsManager()
    this.efsManager = new EfsManager()
    this.eksManager = new EksManager()
    this.elasticacheManager = new ElastiCacheManager()
    this.eventManager = new EventManager()
    this.eventTargetManager = new EventTargetManager()
    this.evidentlyManager = new EvidentlyManager()
    this.iamManager = new IamManager()
    this.kmsManager = new KmsManager()
    this.lambdaManager = new LambdaManager()
    this.logManager = new LogManager()
    this.route53Manager = new Route53Manager()
    this.s3Manager = new S3Manager()
    this.secretsManager = new SecretsManager()
    this.sfnManager = new SfnManager()
    this.snsManager = new SnsManager()
    this.sqsManager = new SqsManager()
    this.ssmManager = new SsmManager()
    this.vpcManager = new VpcManager()
    this.wafManager = new WafManager()

    this.determineFullyQualifiedDomain()
  }

  /**
   * @summary Helper method to add CloudFormation outputs from the construct
   * @param id scoped id of the resource
   * @param value the value of the exported output
   * @param description optional description for the output
   * @param overrideId Flag which indicates whether to override the default logical id of the output
   */
  protected addCfnOutput(id: string, value: string, description?: string, overrideId = true): CfnOutput {
    return createCfnOutput(id, this, value, description, overrideId)
  }

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  protected determineFullyQualifiedDomain() {
    this.fullyQualifiedDomainName = this.props.subDomain
      ? `${this.props.subDomain}.${this.props.domainName}`
      : this.props.domainName
  }

  /**
   * @summary Utility method to determine if the initialisation is in development (dev) stage
   * This is determined by the stage property injected via cdk context
   */
  public isDevelopmentStage = () => isDevStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in test (tst) stage
   * This is determined by the stage property injected via cdk context
   */
  public isTestStage = () => isTestStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in uat (uat) stage
   * This is determined by the stage property injected via cdk context
   */
  public isUatStage = () => isUatStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in production (prd) stage
   * This is determined by the stage property injected via cdk context
   */
  public isProductionStage = () => isPrdStage(this.props.stage)
}
