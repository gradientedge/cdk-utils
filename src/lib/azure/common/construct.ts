import { AzurermProvider } from '@cdktf/provider-azurerm/lib/provider'
import { AzapiProvider } from '../.gen/providers/azapi/provider'
import { Provider } from 'cdktf-local-exec'
import { DataAzurermClientConfig } from '@cdktf/provider-azurerm/lib/data-azurerm-client-config'
import { AzurermBackend, TerraformStack } from 'cdktf'
import { Construct } from 'constructs'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '../../common'
import {
  AzureStorageManager,
  AzureKeyVaultManager,
  AzureApiManagementManager,
  AzureFunctionManager,
  AzureResourceGroupManager,
  AzureAppServiceManager,
  AzureApplicationInsightsManager,
  AzureAppConfigurationManager,
  AzureCosmosDbManager,
  AzureServicebusManager,
  AzureEventgridManager,
  AzureDnsManager,
  AzureLogAnalyticsWorkspaceManager,
  AzureMonitorManager,
  AzureRedisManager,
} from '../services'
import { CommonAzureStackProps } from './types'
import { AzureRemoteBackend } from './constants'
import { AzureResourceNameFormatter } from './resource-name-formatter'

export class CommonAzureConstruct extends TerraformStack {
  declare props: CommonAzureStackProps
  apiManagementManager: AzureApiManagementManager
  appConfigurationManager: AzureAppConfigurationManager
  appServiceManager: AzureAppServiceManager
  applicationInsightsManager: AzureApplicationInsightsManager
  cosmosDbManager: AzureCosmosDbManager
  dnsManager: AzureDnsManager
  eventgridManager: AzureEventgridManager
  fullyQualifiedDomainName: string
  functiontManager: AzureFunctionManager
  id: string
  keyVaultManager: AzureKeyVaultManager
  logAnalyticsWorkspaceManager: AzureLogAnalyticsWorkspaceManager
  monitorManager: AzureMonitorManager
  redisManager: AzureRedisManager
  resourceGroupManager: AzureResourceGroupManager
  resourceNameFormatter: AzureResourceNameFormatter
  servicebusManager: AzureServicebusManager
  storageManager: AzureStorageManager
  tenantId: string

  constructor(scope: Construct, id: string, props: CommonAzureStackProps) {
    super(scope, id)
    this.props = props
    this.id = id

    this.apiManagementManager = new AzureApiManagementManager()
    this.appConfigurationManager = new AzureAppConfigurationManager()
    this.appServiceManager = new AzureAppServiceManager()
    this.applicationInsightsManager = new AzureApplicationInsightsManager()
    this.cosmosDbManager = new AzureCosmosDbManager()
    this.dnsManager = new AzureDnsManager()
    this.eventgridManager = new AzureEventgridManager()
    this.functiontManager = new AzureFunctionManager()
    this.keyVaultManager = new AzureKeyVaultManager()
    this.logAnalyticsWorkspaceManager = new AzureLogAnalyticsWorkspaceManager()
    this.monitorManager = new AzureMonitorManager()
    this.redisManager = new AzureRedisManager()
    this.resourceGroupManager = new AzureResourceGroupManager()
    this.resourceNameFormatter = new AzureResourceNameFormatter(this, `${id}-rnf`, props)
    this.servicebusManager = new AzureServicebusManager()
    this.storageManager = new AzureStorageManager()

    this.determineFullyQualifiedDomain()
    this.determineRemoteBackend()
    this.determineTenantId()

    new AzapiProvider(this, `${this.id}-azapi-provider`, this.props)
    new AzurermProvider(this, `${this.id}-provider`, this.props)
    new Provider(this, `${this.id}-local-exec-provider`)
  }

  /**
   * @summary Determine the fully qualified domain name based on domainName & subDomain
   */
  protected determineFullyQualifiedDomain(): void {
    this.fullyQualifiedDomainName = this.props.subDomain
      ? `${this.props.subDomain}.${this.props.domainName}`
      : this.props.domainName
  }

  protected determineRemoteBackend() {
    const debug = this.node.tryGetContext('debug')
    switch (this.props.remoteBackend?.type) {
      case AzureRemoteBackend.azurerm:
        new AzurermBackend(this, {
          storageAccountName: this.props.remoteBackend.storageAccountName,
          containerName: this.props.remoteBackend.containerName,
          key: `${this.id}`,
          subscriptionId: this.props.subscriptionId,
          resourceGroupName: this.props.remoteBackend.resourceGroupName,
        })
        break
      case AzureRemoteBackend.local:
        if (debug) console.debug(`Using local backend for ${this.id}`)
        break
      default:
        break
    }
  }

  protected determineTenantId() {
    this.tenantId = new DataAzurermClientConfig(this, 'current', {}).tenantId
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
