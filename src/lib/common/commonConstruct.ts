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

/**
 * @category Constructs
 *
 * @mermaid
 *   graph LR;
 *     A[CommonConstruct]-.->|extends|B(cdk.Construct);
 *     B(cdk.Construct)-->|implements|C(cdk.IConstruct);
 */
export class CommonConstruct extends Construct {
  props: CommonStackProps
  appConfigManager: AppConfigManager
  acmManager: AcmManager
  apiManager: ApiManager
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
  vpcManager: VpcManager
  wafManager: WafManager
  fullyQualifiedDomainName: string

  /**
   *
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
    this.vpcManager = new VpcManager()
    this.vpcManager = new VpcManager()
    this.wafManager = new WafManager()

    this.determineFullyQualifiedDomain()
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {string} value
   * @param {string} description
   * @param {boolean} overrideId
   */
  protected addCfnOutput(
    id: string,
    value: string,
    description?: string,
    overrideId = true
  ): cdk.CfnOutput {
    return createCfnOutput(id, this, value, description, overrideId)
  }

  /**
   *
   */
  protected determineFullyQualifiedDomain() {
    this.fullyQualifiedDomainName = this.props.subDomain
      ? `${this.props.subDomain}.${this.props.domainName}`
      : this.props.domainName
  }

  /**
   *
   */
  public isDevelopmentStage = () => isDevStage(this.props.stage)

  /**
   *
   */
  public isTestStage = () => isTestStage(this.props.stage)

  /**
   *
   */
  public isUatStage = () => isUatStage(this.props.stage)

  /**
   *
   */
  public isProductionStage = () => isPrdStage(this.props.stage)
}
