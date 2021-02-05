import * as cdk from '@aws-cdk/core'
import { CommonStackProps } from './commonStack'
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
import { createCfnOutput } from './genericUtils'
import { SecretsManager } from './secretsManager'

export class CommonConstruct extends cdk.Construct {
  props: CommonStackProps
  acmManager: AcmManager
  cloudFrontManager: CloudFrontManager
  cloudTrailManager: CloudTrailManager
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
  fullyQualifiedDomainName: string

  constructor(parent: cdk.Construct, id: string, props: CommonStackProps) {
    super(parent, id)
    this.props = props
    this.acmManager = new AcmManager()
    this.cloudFrontManager = new CloudFrontManager()
    this.cloudTrailManager = new CloudTrailManager()
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
    this.fullyQualifiedDomainName = this.determineFullyQualifiedDomain()
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
    return this.props.subDomain
      ? `${this.props.subDomain}.${this.props.domainName}`
      : this.props.domainName
  }

  public isProductionStage = () => this.props.stage === 'prd'
}
