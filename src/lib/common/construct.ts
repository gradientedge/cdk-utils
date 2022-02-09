import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as aws from '../manager/aws'
import * as types from '../types'
import * as utils from '../utils'

/**
 * @stability stable
 * @category cdk-utils.common-construct
 * @subcategory Construct
 * @classdesc Common construct to use as a base for all higher level constructs.
 *
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
  props: types.CommonStackProps
  acmManager: aws.AcmManager
  apiManager: aws.ApiManager
  appConfigManager: aws.AppConfigManager
  codeBuildManager: aws.CodeBuildManager
  cloudFrontManager: aws.CloudFrontManager
  cloudTrailManager: aws.CloudTrailManager
  cloudWatchManager: aws.CloudWatchManager
  dynamodbManager: aws.DynamodbManager
  ecrManager: aws.EcrManager
  ecsManager: aws.EcsManager
  eksManager: aws.EksManager
  eventManager: aws.EventManager
  iamManager: aws.IamManager
  lambdaManager: aws.LambdaManager
  logManager: aws.LogManager
  route53Manager: aws.Route53Manager
  s3Manager: aws.S3Manager
  secretsManager: aws.SecretsManager
  snsManager: aws.SnsManager
  ssMManager: aws.SsmManager
  vpcManager: aws.VpcManager
  wafManager: aws.WafManager
  elasticacheManager: aws.ElastiCacheManager
  fullyQualifiedDomainName: string

  constructor(parent: Construct, id: string, props: types.CommonStackProps) {
    super(parent, id)
    this.props = props
    this.acmManager = new aws.AcmManager()
    this.apiManager = new aws.ApiManager()
    this.appConfigManager = new aws.AppConfigManager()
    this.codeBuildManager = new aws.CodeBuildManager()
    this.cloudFrontManager = new aws.CloudFrontManager()
    this.cloudTrailManager = new aws.CloudTrailManager()
    this.cloudWatchManager = new aws.CloudWatchManager()
    this.dynamodbManager = new aws.DynamodbManager()
    this.ecrManager = new aws.EcrManager()
    this.ecsManager = new aws.EcsManager()
    this.eksManager = new aws.EksManager()
    this.eventManager = new aws.EventManager()
    this.iamManager = new aws.IamManager()
    this.lambdaManager = new aws.LambdaManager()
    this.logManager = new aws.LogManager()
    this.route53Manager = new aws.Route53Manager()
    this.s3Manager = new aws.S3Manager()
    this.secretsManager = new aws.SecretsManager()
    this.snsManager = new aws.SnsManager()
    this.ssMManager = new aws.SsmManager()
    this.vpcManager = new aws.VpcManager()
    this.wafManager = new aws.WafManager()
    this.elasticacheManager = new aws.ElastiCacheManager()

    this.determineFullyQualifiedDomain()
  }

  /**
   * @summary Helper method to add CloudFormation outputs from the construct
   * @param {string} id scoped id of the resource
   * @param {string} value the value of the exported output
   * @param {string?} description optional description for the output
   * @param {boolean} overrideId Flag which indicates whether to override the default logical id of the output
   */
  protected addCfnOutput(id: string, value: string, description?: string, overrideId = true): cdk.CfnOutput {
    return utils.createCfnOutput(id, this, value, description, overrideId)
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
  public isDevelopmentStage = () => utils.isDevStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in test (tst) stage
   * This is determined by the stage property injected via cdk context
   */
  public isTestStage = () => utils.isTestStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in uat (uat) stage
   * This is determined by the stage property injected via cdk context
   */
  public isUatStage = () => utils.isUatStage(this.props.stage)

  /**
   * @summary Utility method to determine if the initialisation is in production (prd) stage
   * This is determined by the stage property injected via cdk context
   */
  public isProductionStage = () => utils.isPrdStage(this.props.stage)
}
