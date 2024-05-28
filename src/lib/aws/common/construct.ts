import { CfnOutput, Fn } from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common'
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
} from '../services'
import { createCfnOutput } from '../utils'
import { CommonStackProps } from './types'
import _ from 'lodash'

/**
 * @subcategory Construct
 * @classdesc Common construct to use as a base for all higher level constructs.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils';
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props);
 *     this.props = props;
 *   };
 * };
 */
export class CommonConstruct extends Construct {
  props: CommonStackProps
  acmManager: AcmManager
  apiManager: ApiManager
  appConfigManager: AppConfigManager
  codeBuildManager: CodeBuildManager
  cloudFrontManager: CloudFrontManager
  cloudTrailManager: CloudTrailManager
  cloudWatchManager: CloudWatchManager
  dynamodbManager: DynamodbManager
  ecrManager: EcrManager
  ecsManager: EcsManager
  efsManager: EfsManager
  eksManager: EksManager
  elasticacheManager: ElastiCacheManager
  eventManager: EventManager
  eventTargetManager: EventTargetManager
  evidentlyManager: EvidentlyManager
  iamManager: IamManager
  kmsManager: KmsManager
  lambdaManager: LambdaManager
  logManager: LogManager
  route53Manager: Route53Manager
  s3Manager: S3Manager
  secretsManager: SecretsManager
  sfnManager: SfnManager
  snsManager: SnsManager
  sqsManager: SqsManager
  ssmManager: SsmManager
  vpcManager: VpcManager
  wafManager: WafManager

  fullyQualifiedDomainName: string

  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id)
    this.props = props
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
