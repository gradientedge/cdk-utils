import { Provider as CloudflareProvider } from '@pulumi/cloudflare'
import { ComponentResource, ComponentResourceOptions, Config } from '@pulumi/pulumi'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common/index.js'
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
} from '../services/index.js'
import { CommonCloudflareStackProps } from './types.js'

export class CommonCloudflareConstruct extends ComponentResource {
  declare props: CommonCloudflareStackProps
  declare options?: ComponentResourceOptions
  id: string
  config: Config
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
  provider: CloudflareProvider

  constructor(name: string, props: CommonCloudflareStackProps, options?: ComponentResourceOptions) {
    super(`custom:cloudflare:Construct:${name}`, name, props, options)
    this.props = props
    this.options = options
    this.id = name

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

    /* initialise config */
    this.config = new Config()
    this.determineFullyQualifiedDomain()
    this.provider = new CloudflareProvider(`${this.id}-provider`, this.props, options)
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
