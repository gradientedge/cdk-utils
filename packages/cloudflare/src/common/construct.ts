import { isDevStage, isPrdStage, isTestStage, isUatStage } from '@gradientedge/cdk-utils-common'
import { Provider as CloudflareProvider } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import { ComponentResource, ComponentResourceOptions, Config } from '@pulumi/pulumi'
import _ from 'lodash'

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

/**
 * Common construct to use as a base for all Cloudflare constructs.
 * Initialises all service managers and configures the Cloudflare provider.
 * - Extend this class to create custom Cloudflare constructs.
 * - All service managers (e.g. {@link CloudflareAccessManager}, {@link CloudflareZoneManager}) are available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct, CommonCloudflareStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(name: string, props: CommonCloudflareStackProps) {
 *     super(name, props)
 *     this.zoneManager.createZone('MyZone', this, props)
 *   }
 * }
 * ```
 * @category Common
 */
export class CommonCloudflareConstruct extends ComponentResource {
  /** The construct stack properties */
  declare props: CommonCloudflareStackProps
  /** Optional Pulumi component resource options */
  declare options?: ComponentResourceOptions
  /** The scoped identifier for this construct */
  id: string
  /** The Pulumi configuration instance */
  config: Config
  /** The fully qualified domain name resolved from domainName and subDomain */
  fullyQualifiedDomainName: string
  /** Manager for Cloudflare Access operations */
  accessManager: CloudflareAccessManager
  /** Manager for Cloudflare API Shield operations */
  apiShieldManager: CloudflareApiShieldManager
  /** Manager for Cloudflare Argo operations */
  argoManager: CloudflareArgoManager
  /** Manager for Cloudflare Filter operations */
  filterManager: CloudflareFilterManager
  /** Manager for Cloudflare Firewall operations */
  firewallManager: CloudflareFirewallManager
  /** Manager for Cloudflare Pages operations */
  pageManager: CloudflarePageManager
  /** Manager for Cloudflare DNS Record operations */
  recordManager: CloudflareRecordManager
  /** Manager for Cloudflare Rule Set operations */
  ruleSetManager: CloudflareRuleSetManager
  /** Manager for Cloudflare Worker operations */
  workerManager: CloudflareWorkerManager
  /** Manager for Cloudflare Zone operations */
  zoneManager: CloudflareZoneManager
  /** The Cloudflare provider instance */
  provider: CloudflareProvider

  /**
   * @summary Create a new CommonCloudflareConstruct
   * @param name scoped id of the construct
   * @param props the common cloudflare stack properties
   * @param options optional Pulumi component resource options
   */
  constructor(name: string, props: CommonCloudflareStackProps, options?: ComponentResourceOptions) {
    /* omit apiToken from the inputs registered with the parent ComponentResource so it is not
       persisted as a plaintext component input - the provider schema handles the token securely */
    super(`construct:${name}`, name, _.omit(props, 'apiToken'), options)
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
   * @summary Resolve a Pulumi stack reference by name
   * @param stackName the fully qualified stack name to resolve
   * @returns the resolved stack reference
   */
  protected resolveStack(stackName: string) {
    if (!stackName) throw new Error('Stack name undefined')
    return new pulumi.StackReference(stackName)
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
