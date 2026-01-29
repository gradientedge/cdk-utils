import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common/index.js'
import {
  AzureApiManagementManager,
  AzureAppConfigurationManager,
  AzureAppServiceManager,
  AzureApplicationInsightsManager,
  AzureCosmosDbManager,
  AzureDnsManager,
  AzureEventgridManager,
  AzureFunctionManager,
  AzureKeyVaultManager,
  AzureOperationalInsightsManager,
  AzureMonitorManager,
  AzureRedisManager,
  AzureResourceGroupManager,
  AzureServicebusManager,
  AzureStorageManager,
} from '../services/index.js'
import { AzureResourceNameFormatter } from './resource-name-formatter.js'
import { CommonAzureStackProps } from './types.js'

/**
 * @classdesc Common Azure construct to use as a base for all higher level constructs using Pulumi
 * - Provides manager instances for all Azure services
 * - Handles resource naming conventions
 * - Manages common properties and utilities
 * @example
 * ```typescript
 * import { CommonAzureConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     // provision resources using this.resourceGroupManager, etc.
 *   }
 * }
 * ```
 */
export class CommonAzureConstruct extends ComponentResource {
  declare props: CommonAzureStackProps
  declare options?: ComponentResourceOptions
  id: string
  fullyQualifiedDomainName: string
  apiManagementManager: AzureApiManagementManager
  appConfigurationManager: AzureAppConfigurationManager
  appServiceManager: AzureAppServiceManager
  applicationInsightsManager: AzureApplicationInsightsManager
  cosmosDbManager: AzureCosmosDbManager
  dnsManager: AzureDnsManager
  eventgridManager: AzureEventgridManager
  functionManager: AzureFunctionManager
  keyVaultManager: AzureKeyVaultManager
  operationalInsightsManager: AzureOperationalInsightsManager
  monitorManager: AzureMonitorManager
  redisManager: AzureRedisManager
  resourceGroupManager: AzureResourceGroupManager
  resourceNameFormatter: AzureResourceNameFormatter
  servicebusManager: AzureServicebusManager
  storageManager: AzureStorageManager

  constructor(name: string, props: CommonAzureStackProps, options?: ComponentResourceOptions) {
    super(`custom:azure:Construct:${name}`, name, props, options)
    this.props = props
    this.options = options
    this.id = name

    this.apiManagementManager = new AzureApiManagementManager()
    this.appConfigurationManager = new AzureAppConfigurationManager()
    this.appServiceManager = new AzureAppServiceManager()
    this.applicationInsightsManager = new AzureApplicationInsightsManager()
    this.cosmosDbManager = new AzureCosmosDbManager()
    this.dnsManager = new AzureDnsManager()
    this.eventgridManager = new AzureEventgridManager()
    this.functionManager = new AzureFunctionManager()
    this.keyVaultManager = new AzureKeyVaultManager()
    this.operationalInsightsManager = new AzureOperationalInsightsManager()
    this.monitorManager = new AzureMonitorManager()
    this.redisManager = new AzureRedisManager()
    this.resourceGroupManager = new AzureResourceGroupManager()
    this.resourceNameFormatter = new AzureResourceNameFormatter(props)
    this.servicebusManager = new AzureServicebusManager()
    this.storageManager = new AzureStorageManager()

    this.determineFullyQualifiedDomain()
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
