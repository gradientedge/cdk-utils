import { CloudflareProvider } from '@cdktf/provider-cloudflare/lib/provider'
import { TerraformStack } from 'cdktf'
import { Construct } from 'constructs'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common'
import {
  CloudflareAccessManager,
  CloudflareApiShieldManager,
  CloudflareArgoManager,
  CloudflareFilterManager,
  CloudflareFirewallManager,
  CloudflareWorkerManager,
  CloudflareZoneManager,
} from '../services'
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
  workerManager: CloudflareWorkerManager
  zoneManager: CloudflareZoneManager

  constructor(scope: Construct, id: string, props: CommonCloudflareStackProps) {
    super(scope, id)
    this.props = props
    this.id = id

    this.accessManager = new CloudflareAccessManager()
    this.apiShieldManager = new CloudflareApiShieldManager()
    this.argoManager = new CloudflareArgoManager()
    this.filterManager = new CloudflareFilterManager()
    this.firewallManager = new CloudflareFirewallManager()
    this.zoneManager = new CloudflareZoneManager()
    this.workerManager = new CloudflareWorkerManager()

    this.determineFullyQualifiedDomain()
    new CloudflareProvider(this, `${this.id}-provider`, this.props)
  }

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  protected determineFullyQualifiedDomain(): void {
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
