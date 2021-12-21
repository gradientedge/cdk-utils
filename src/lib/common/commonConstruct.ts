import * as cdk from 'aws-cdk-lib'
import { createCfnOutput, isDevStage, isPrdStage, isTestStage, isUatStage } from '../utils'
import { CommonStackProps } from '../types'
import { Route53Manager } from '../manager/route53Manager'
import { S3Manager } from '../manager/s3Manager'
import { AcmManager } from '../manager/acmManager'
import { CloudFrontManager } from '../manager/cloudFrontManager'
import { LogManager } from '../manager/logManager'
import { IamManager } from '../manager/iamManager'
import { CloudTrailManager } from '../manager/cloudTrailManager'
import { EcsManager } from '../manager/ecsManager'
import { EventManager } from '../manager/eventManager'
import { VpcManager } from '../manager/vpcManager'
import { EksManager } from '../manager/eksManager'
import { EcrManager } from '../manager/ecrManager'
import { LambdaManager } from '../manager/lambdaManager'
import { SnsManager } from '../manager/snsManager'
import { SecretsManager } from '../manager/secretsManager'
import { CloudWatchManager } from '../manager/cloudWatchManager'
import { WafManager } from '../manager/wafManager'
import { AppConfigManager } from '../manager/appConfigManager'
import { Construct } from 'constructs'
import { ApiManager } from '../manager/apiManager'
import { SsmManager } from '../manager/ssmManager'

/**
 * @stability stable
 * @category Constructs
 * @summary Common construct to use as a base for all higher level constructs.
 *
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     // provision resources here...
 * }
 *
 * @mermaid
 *   graph LR;
 *     A[CommonConstruct]-.->|extends|B(Construct);
 *     B(Construct)-->|implements|C(IConstruct);
 */
export class CommonConstruct extends Construct {
  props: CommonStackProps
  acmManager: AcmManager
  apiManager: ApiManager
  appConfigManager: AppConfigManager
  cloudFrontManager: CloudFrontManager
  cloudTrailManager: CloudTrailManager
  cloudWatchManager: CloudWatchManager
  ecrManager: EcrManager
  ecsManager: EcsManager
  eksManager: EksManager
  eventManager: EventManager
  iamManager: IamManager
  lambdaManager: LambdaManager
  logManager: LogManager
  route53Manager: Route53Manager
  s3Manager: S3Manager
  secretsManager: SecretsManager
  snsManager: SnsManager
  ssMManager: SsmManager
  vpcManager: VpcManager
  wafManager: WafManager
  fullyQualifiedDomainName: string

  /**
   * @summary Constructor to initialise the CommonConstruct
   * @param {Construct} parent
   * @param {string} id scoped id of the resource
   * @param {CommonStackProps} props
   */
  constructor(parent: Construct, id: string, props: CommonStackProps) {
    super(parent, id)
    this.props = props
    this.acmManager = new AcmManager()
    this.apiManager = new ApiManager()
    this.appConfigManager = new AppConfigManager()
    this.cloudFrontManager = new CloudFrontManager()
    this.cloudTrailManager = new CloudTrailManager()
    this.cloudWatchManager = new CloudWatchManager()
    this.ecrManager = new EcrManager()
    this.ecsManager = new EcsManager()
    this.eksManager = new EksManager()
    this.eventManager = new EventManager()
    this.iamManager = new IamManager()
    this.lambdaManager = new LambdaManager()
    this.logManager = new LogManager()
    this.route53Manager = new Route53Manager()
    this.s3Manager = new S3Manager()
    this.secretsManager = new SecretsManager()
    this.snsManager = new SnsManager()
    this.ssMManager = new SsmManager()
    this.vpcManager = new VpcManager()
    this.vpcManager = new VpcManager()
    this.wafManager = new WafManager()

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
