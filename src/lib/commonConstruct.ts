import * as cdk from '@aws-cdk/core'
import { createCfnOutput, isDevStage, isPrdStage, isTestStage, isUatStage } from './genericUtils'
import { CommonStackProps } from './types'
import { Route53Manager } from './route53Manager'
import { S3Manager } from './s3Manager'
import { AcmManager } from './acmManager'
import { CloudFrontManager } from './cloudFrontManager'
import { LogManager } from './logManager'
import { IamManager } from './iamManager'
import { CloudTrailManager } from './cloudTrailManager'
import { EcsManager } from './ecsManager'
import { EventManager } from './eventManager'
import { VpcManager } from './vpcManager'
import { EksManager } from './eksManager'
import { EcrManager } from './ecrManager'
import { LambdaManager } from './lambdaManager'
import { SnsManager } from './snsManager'
import { SecretsManager } from './secretsManager'
import { CloudWatchManager } from './cloudWatchManager'
import { WafManager } from './wafManager'
import { AppConfigManager } from './appConfigManager'

export class CommonConstruct extends cdk.Construct {
  props: CommonStackProps
  appConfigManager: AppConfigManager
  acmManager: AcmManager
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

  constructor(parent: cdk.Construct, id: string, props: CommonStackProps) {
    super(parent, id)
    this.props = props
    this.acmManager = new AcmManager()
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

    this.determineFullyQualifiedDomain()
  }

  protected addCfnOutput(
    id: string,
    value: string,
    description?: string,
    overrideId = true
  ): cdk.CfnOutput {
    return createCfnOutput(id, this, value, description, overrideId)
  }

  protected determineFullyQualifiedDomain() {
    this.fullyQualifiedDomainName = this.props.subDomain
      ? `${this.props.subDomain}.${this.props.domainName}`
      : this.props.domainName
  }

  public isDevelopmentStage = () => isDevStage(this.props.stage)
  public isTestStage = () => isTestStage(this.props.stage)
  public isUatStage = () => isUatStage(this.props.stage)
  public isProductionStage = () => isPrdStage(this.props.stage)
}
