import { isDevStage, isPrdStage, isTestStage, isUatStage } from '@gradientedge/cdk-utils-common'
import { getWorkspaceOutput, GetWorkspaceResult, Workspace } from '@pulumi/azure-native/operationalinsights/index.js'
import { ResourceGroup } from '@pulumi/azure-native/resources/index.js'
import * as pulumi from '@pulumi/pulumi'
import { ComponentResource, ComponentResourceOptions, Output } from '@pulumi/pulumi'

import { AzureAuthorisationManager } from '../services/authorisation/main.js'
import {
  AzureApiManagementManager,
  AzureAppConfigurationManager,
  AzureApplicationInsightsManager,
  AzureAppServiceManager,
  AzureCosmosDbManager,
  AzureDnsManager,
  AzureEventgridManager,
  AzureFunctionManager,
  AzureKeyVaultManager,
  AzureMonitorManager,
  AzureOperationalInsightsManager,
  AzurePortalManager,
  AzureRedisManager,
  AzureResourceGroupManager,
  AzureSecurityCentermanager,
  AzureServiceBusManager,
  AzureStorageManager,
} from '../services/index.js'

import { AzureResourceNameFormatter } from './resource-name-formatter.js'
import { CommonAzureStackProps } from './types.js'

/**
 * Common Azure construct to use as a base for all higher level constructs using Pulumi
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
 * @category Common
 */
export class CommonAzureConstruct extends ComponentResource {
  /** Stack properties for the construct */
  declare props: CommonAzureStackProps
  /** Optional Pulumi component resource options */
  declare options?: ComponentResourceOptions
  /** Unique identifier for the construct */
  id: string
  /** The Azure resource group associated with this construct */
  resourceGroup: ResourceGroup
  /** The fully qualified domain name derived from domainName and subDomain */
  fullyQualifiedDomainName: string
  /** Manager for Azure RBAC role assignments */
  authorisationManager: AzureAuthorisationManager
  /** Manager for Azure API Management resources */
  apiManagementManager: AzureApiManagementManager
  /** Manager for Azure App Configuration resources */
  appConfigurationManager: AzureAppConfigurationManager
  /** Manager for Azure App Service resources */
  appServiceManager: AzureAppServiceManager
  /** Manager for Azure Application Insights resources */
  applicationInsightsManager: AzureApplicationInsightsManager
  /** Manager for Azure CosmosDB resources */
  cosmosDbManager: AzureCosmosDbManager
  /** Manager for Azure DNS resources */
  dnsManager: AzureDnsManager
  /** Manager for Azure Event Grid resources */
  eventgridManager: AzureEventgridManager
  /** Manager for Azure Function App resources */
  functionManager: AzureFunctionManager
  /** Manager for Azure Key Vault resources */
  keyVaultManager: AzureKeyVaultManager
  /** Manager for Azure Log Analytics Workspace resources */
  operationalInsightsManager: AzureOperationalInsightsManager
  /** Manager for Azure Portal Dashboard resources */
  portalManager: AzurePortalManager
  /** Manager for Azure Monitor diagnostic settings */
  monitorManager: AzureMonitorManager
  /** Manager for Azure Managed Redis (Enterprise) resources */
  redisManager: AzureRedisManager
  /** Manager for Azure Resource Group resources */
  resourceGroupManager: AzureResourceGroupManager
  /** Formatter for Azure resource names based on naming conventions */
  resourceNameFormatter: AzureResourceNameFormatter
  /** Manager for Azure Security Center (Defender) resources */
  securityCentermanager: AzureSecurityCentermanager
  /** Manager for Azure Service Bus resources */
  serviceBusManager: AzureServiceBusManager
  /** Manager for Azure Storage resources */
  storageManager: AzureStorageManager
  /** Shared Log Analytics Workspace resolved from props, used for diagnostic logging */
  commonLogAnalyticsWorkspace: Workspace | Output<GetWorkspaceResult>

  /**
   * @summary Create a new CommonAzureConstruct
   * @param name the scoped name of the construct
   * @param props the common Azure stack properties
   * @param options optional Pulumi component resource options
   */
  constructor(name: string, props: CommonAzureStackProps, options?: ComponentResourceOptions) {
    super(`construct:${name}`, name, props, options)
    this.props = props
    this.options = options
    this.id = name

    this.authorisationManager = new AzureAuthorisationManager()
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
    this.portalManager = new AzurePortalManager()
    this.monitorManager = new AzureMonitorManager()
    this.redisManager = new AzureRedisManager()
    this.resourceGroupManager = new AzureResourceGroupManager()
    this.resourceNameFormatter = new AzureResourceNameFormatter(props)
    this.securityCentermanager = new AzureSecurityCentermanager()
    this.serviceBusManager = new AzureServiceBusManager()
    this.storageManager = new AzureStorageManager()
  }

  /**
   * @summary Resolve a Pulumi stack reference for cross-stack outputs
   * @param id scoped id of the stack reference resource
   * @param stackName optional fully qualified stack name; defaults to id if not provided
   */
  protected resolveStack(id: string, stackName?: string) {
    const name = stackName ?? id
    if (!name) throw new Error('Stack name undefined')
    return new pulumi.StackReference(id, {
      name,
    })
  }

  /**
   * @summary Create the resource group for this construct
   * - Uses the resourceGroupName from props or falls back to the construct id
   * - Registers resource group id and name as stack outputs
   * - No-op if the resource group already exists
   */
  protected createResourceGroup() {
    if (this.resourceGroup) return

    this.resourceGroup = this.resourceGroupManager.createResourceGroup(`${this.id}`, this, {
      resourceGroupName: this.props.resourceGroupName ?? this.id,
      location: this.props.location,
    })

    this.registerOutputs({
      resourceGroupId: this.resourceGroup.id,
      resourceGroupName: this.resourceGroup.name,
    })
  }

  /**
   * @summary Resolve a shared Log Analytics Workspace from props
   * - Populates the commonLogAnalyticsWorkspace property for use in diagnostic settings
   * - No-op if commonLogAnalyticsWorkspace is not configured in props
   */
  protected resolveCommonLogAnalyticsWorkspace() {
    if (!this.props.commonLogAnalyticsWorkspace || !this.props.commonLogAnalyticsWorkspace.workspaceName) return

    this.commonLogAnalyticsWorkspace = getWorkspaceOutput({
      workspaceName: this.props.commonLogAnalyticsWorkspace.workspaceName,
      resourceGroupName: this.props.commonLogAnalyticsWorkspace.resourceGroupName,
    })
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
