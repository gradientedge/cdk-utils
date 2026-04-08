import { getWorkspaceOutput, GetWorkspaceResult, Workspace } from '@pulumi/azure-native/operationalinsights/index.js'
import { ResourceGroup } from '@pulumi/azure-native/resources/index.js'
import * as pulumi from '@pulumi/pulumi'
import { ComponentResource, ComponentResourceOptions, Output } from '@pulumi/pulumi'
import { isDevStage, isPrdStage, isTestStage, isUatStage } from '@gradientedge/cdk-utils-common'

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
  declare props: CommonAzureStackProps
  declare options?: ComponentResourceOptions
  id: string
  resourceGroup: ResourceGroup
  fullyQualifiedDomainName: string
  authorisationManager: AzureAuthorisationManager
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
  portalManager: AzurePortalManager
  monitorManager: AzureMonitorManager
  redisManager: AzureRedisManager
  resourceGroupManager: AzureResourceGroupManager
  resourceNameFormatter: AzureResourceNameFormatter
  securityCentermanager: AzureSecurityCentermanager
  serviceBusManager: AzureServiceBusManager
  storageManager: AzureStorageManager
  commonLogAnalyticsWorkspace: Workspace | Output<GetWorkspaceResult>

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

    this.determineFullyQualifiedDomain()
  }

  protected resolveStack(stackName: string) {
    if (!stackName) throw new Error('Stack name undefined')
    return new pulumi.StackReference(stackName)
  }

  protected createResourceGroup() {
    if (this.resourceGroup) return

    this.resourceGroup = this.resourceGroupManager.createResourceGroup(`${this.id}`, this, {
      resourceGroupName: this.props.stackName,
      location: this.props.location,
    })

    this.registerOutputs({
      resourceGroupId: this.resourceGroup.id,
      resourceGroupName: this.resourceGroup.name,
    })
  }

  protected resolveCommonLogAnalyticsWorkspace() {
    if (!this.props.commonLogAnalyticsWorkspace || !this.props.commonLogAnalyticsWorkspace.workspaceName)
      throw new Error('Props undefined for commonLogAnalyticsWorkspace')

    this.commonLogAnalyticsWorkspace = getWorkspaceOutput({
      workspaceName: this.props.commonLogAnalyticsWorkspace.workspaceName,
      resourceGroupName: this.props.commonLogAnalyticsWorkspace.resourceGroupName,
    })
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
