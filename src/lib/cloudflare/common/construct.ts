import { AwsProvider } from '@cdktf/provider-aws/lib/provider'
import { CloudflareProvider } from '@cdktf/provider-cloudflare/lib/provider'
import { AzurermProvider } from '@cdktf/provider-azurerm/lib/provider'
import { AzurermBackend, S3Backend, TerraformStack, TerraformVariable } from 'cdktf'
import { Construct } from 'constructs'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common'
import {
  CloudflareAccessManager,
  CloudflareApiShieldManager,
  CloudflareArgoManager,
  CloudflareFilterManager,
  CloudflareFirewallManager,
  CloudflarePageManager,
  CloudflareRecordManager,
  CloudflareRuleSetManager,
  CloudflareWorkerManager,
  CloudflareZoneManager,
} from '../services'
import { RemoteBackend } from './constants'
import { CommonCloudflareStackProps } from './types'

export class CommonCloudflareConstruct extends TerraformStack {
  declare props: CommonCloudflareStackProps
  id: string
  fullyQualifiedDomainName: string
  accessManager: CloudflareAccessManager
  apiShieldManager: CloudflareApiShieldManager
  argoManager: CloudflareArgoManager
  filterManager: CloudflareFilterManager
  firewallManager: CloudflareFirewallManager
  pageManager: CloudflarePageManager
  recordManager: CloudflareRecordManager
  ruleSetManager: CloudflareRuleSetManager
  workerManager: CloudflareWorkerManager
  zoneManager: CloudflareZoneManager
  awsProvider: AwsProvider
  s3Backend: S3Backend
  azurermProvider: AzurermProvider
  azurermBackend: AzurermBackend

  constructor(scope: Construct, id: string, props: CommonCloudflareStackProps) {
    super(scope, id)
    this.props = props
    this.id = id

    this.accessManager = new CloudflareAccessManager()
    this.apiShieldManager = new CloudflareApiShieldManager()
    this.argoManager = new CloudflareArgoManager()
    this.filterManager = new CloudflareFilterManager()
    this.firewallManager = new CloudflareFirewallManager()
    this.pageManager = new CloudflarePageManager()
    this.recordManager = new CloudflareRecordManager()
    this.ruleSetManager = new CloudflareRuleSetManager()
    this.workerManager = new CloudflareWorkerManager()
    this.zoneManager = new CloudflareZoneManager()

    this.determineFullyQualifiedDomain()
    this.determineAccountId()
    this.determineApiToken()
    this.determineRemoteBackend()
    new CloudflareProvider(this, `${this.id}-provider`, this.props)
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
   * @summary Determine the account id based on the cdktf.json context
   */
  protected determineAccountId() {
    this.props.accountId = new TerraformVariable(this, `accountId`, {}).stringValue
  }

  /**
   * @summary Determine the api token based on the cdktf.json context
   */
  protected determineApiToken() {
    this.props.apiToken = new TerraformVariable(this, `apiToken`, {}).stringValue
  }

  protected determineRemoteBackend() {
    const debug = this.node.tryGetContext('debug')
    console.log('what is remote bucket type', this.props.remoteBackend?.type)
    switch (this.props.remoteBackend?.type) {
      case RemoteBackend.s3:
        this.awsProvider = new AwsProvider(this, `${this.id}-aws-provider`, {
          profile: process.env.AWS_PROFILE,
          region: this.props.remoteBackend.region,
        })
        this.s3Backend = new S3Backend(this, {
          bucket: this.props.remoteBackend.bucketName,
          dynamodbTable: this.props.remoteBackend.tableName,
          key: `${this.id}`,
          profile: process.env.AWS_PROFILE,
          region: this.props.remoteBackend.region,
        })
        break
      case RemoteBackend.azurerm:
        console.log('what is the subscription id', this.props.remoteBackend.subscriptionId)
        this.azurermProvider = new AzurermProvider(this, `${this.id}-azurerm-provider`, {
          features: [{}],
          subscriptionId: this.props.remoteBackend.subscriptionId,
        })
        this.azurermBackend = new AzurermBackend(this, {
          storageAccountName: this.props.remoteBackend.storageAccountName,
          containerName: this.props.remoteBackend.containerName,
          key: `${this.id}`,
          subscriptionId: this.props.remoteBackend.subscriptionId,
          resourceGroupName: this.props.remoteBackend.resourceGroupName,
        })
        break
      case RemoteBackend.local:
        if (debug) console.debug(`Using local backend for ${this.id}`)
        break
      default:
        break
    }
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
