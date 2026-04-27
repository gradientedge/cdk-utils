import fs from 'fs'
import * as path from 'path'

import * as archive from '@pulumi/archive'
import {
  ConfigurationStore,
  getConfigurationStoreOutput,
  GetConfigurationStoreResult,
} from '@pulumi/azure-native/appconfiguration/index.js'
import { getComponentOutput, GetComponentResult } from '@pulumi/azure-native/applicationinsights/index.js'
import { PrincipalType } from '@pulumi/azure-native/authorization/index.js'
import { SkuFamily, SkuName, Vault } from '@pulumi/azure-native/keyvault/index.js'
import { Dashboard } from '@pulumi/azure-native/portal/index.js'
import { BlobContainer, listStorageAccountKeysOutput, StorageAccount } from '@pulumi/azure-native/storage/index.js'
import {
  AppServicePlan,
  AuthenticationType,
  FunctionsDeploymentStorageType,
  WebApp,
} from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import { Output, ResourceOptions } from '@pulumi/pulumi'
import _ from 'lodash'

import { CommonAzureConstruct } from '../../common/index.js'
import { CosmosRoleDefinition } from '../../services/cosmosdb/constants.js'
import { AzureAppConfigurationManager, RoleDefinitionId } from '../../services/index.js'

import { AzureFunctionAppProps } from './types.js'

/**
 * Provides a construct to create and deploy an Azure Function App with Flex Consumption hosting
 * @example
 * import { AzureFunctionApp, AzureFunctionAppProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends AzureFunctionApp {
 *   constructor(id: string, props: AzureFunctionAppProps) {
 *     super(id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class AzureFunctionApp extends CommonAzureConstruct {
  props: AzureFunctionAppProps
  app: WebApp
  appServicePlan: AppServicePlan
  appEnvironmentVariables: Record<string, any> = {}
  appStorageAccount: StorageAccount
  appDeploymentStorageContainer: BlobContainer
  appStorageContainer: BlobContainer
  appConfig: ConfigurationStore | Output<GetConfigurationStoreResult>
  appCodeArchiveFile: Output<archive.GetFileResult>
  appConfigHash: string
  appKeyVaultsByResourceGroup: Map<string, Set<string>> = {} as Map<string, Set<string>>
  appConnectionStrings: any[] = []
  appConfigPrefix?: string
  appConfigurationsParsedConfig: any
  appConfigurationsOriginalParsedConfig: any

  dataKeyVault: Vault
  dataStorageAccount: StorageAccount
  dataStorageContainer: BlobContainer

  applicationInsights: Output<GetComponentResult>
  functionDashboard: Dashboard

  /**
   * @summary Create a new AzureFunctionApp
   * @param id scoped id of the resource
   * @param props the function app properties
   */
  constructor(id: string, props: AzureFunctionAppProps) {
    super(id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createAppServicePlan()
    this.createdParsedAppConfigurations()
    this.createAppConfiguration()
    this.createAppConfigurations()
    this.createStorageAccount()
    this.createStorageDeploymentContainer()
    this.createStorageContainer()
    this.createDataStorageAccount()
    this.createDataStorageContainer()
    this.generateStorageContainerSas()
    this.createFunctionHosts()
    this.createCodePackage()
    this.createFunctionAppSiteConfig()
    this.createFunctionApp()
    this.createRoleAssignments()
    this.createFunctionDashboard()
  }

  /**
   * @summary Method to resolve the Application Insights instance
   */
  protected resolveApplicationInsights() {
    if (!this.props.commonApplicationInsights || !this.props.commonApplicationInsights.resourceName) return

    this.applicationInsights = getComponentOutput({
      resourceName: this.props.commonApplicationInsights.resourceName,
      resourceGroupName: this.props.commonApplicationInsights.resourceGroupName,
    })
  }

  /**
   * @summary Method to create the App Service Plan for the function app
   */
  protected createAppServicePlan() {
    this.appServicePlan = this.appServiceManager.createAppServicePlan(`${this.id}-app-service-plan`, this, {
      ...this.props.functionApp.servicePlan,
      name: this.id,
      kind: this.props.functionApp.servicePlan?.kind ?? 'functionapp',
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
    })
  }

  /**
   * @summary Method to create parsed app configurations
   * - To be implemented in the overriding method in the implementation class
   */
  protected createdParsedAppConfigurations() {}

  /**
   * @summary Method to create or resolve the App Configuration store
   */
  protected createAppConfiguration() {
    if (this.props.functionApp.appConfiguration) {
      this.appConfig = this.appConfigurationManager.createConfigurationStore(`${this.id}-app-configuration`, this, {
        ...this.props.functionApp.appConfiguration,
        resourceGroupName: this.resourceGroup.name,
        location: this.resourceGroup.location,
      })
    } else if (!this.props.useConfigOverride) {
      this.appConfig = getConfigurationStoreOutput({
        configStoreName: this.props.existingConfigStoreName,
        resourceGroupName: this.props.existingConfigStoreResourceGroupName,
      })
    }
    this.appConfigPrefix = _.camelCase(this.id)
  }

  /**
   * @summary Method to create app configurations
   * - To be implemented in the overriding method in the implementation class
   */
  protected createAppConfigurations() {}

  /**
   * @summary Method to create the storage account for the function app
   */
  protected createStorageAccount() {
    this.appStorageAccount = this.storageManager.createStorageAccount(`${this.id}-storage-account`, this, {
      ...this.props.functionApp.storageAccount,
      location: this.resourceGroup.location,
      resourceGroupName: this.resourceGroup.name,
    })
  }

  /**
   * @summary Method to create the storage deployment container for the function app
   */
  protected createStorageDeploymentContainer() {
    this.appDeploymentStorageContainer = this.storageManager.createStorageContainer(
      `${this.id}-storage-deployment-container`,
      this,
      {
        ...this.props.functionApp.deploymentStorageContainer,
        accountName: this.appStorageAccount.name,
        resourceGroupName: this.resourceGroup.name,
      }
    )
  }

  /**
   * @summary Method to create the storage container for the function app
   */
  protected createStorageContainer() {
    if (!this.props.functionApp.storageContainer) return

    this.appStorageContainer = this.storageManager.createStorageContainer(`${this.id}-storage-container`, this, {
      ...this.props.functionApp.storageContainer,
      accountName: this.appStorageAccount.name,
      resourceGroupName: this.resourceGroup.name,
    })

    this.appEnvironmentVariables = {
      ...this.appEnvironmentVariables,
      AZURE_STORAGE_ACCOUNT_NAME: this.appStorageAccount.name,
    }
  }

  /**
   * @summary Method to create the data storage account
   */
  protected createDataStorageAccount() {
    if (!this.props.dataStorageAccount) return

    this.dataStorageAccount = this.storageManager.createStorageAccount(`${this.id}-data-storage-account`, this, {
      ...this.props.dataStorageAccount,
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
    })

    this.appEnvironmentVariables = {
      ...this.appEnvironmentVariables,
      AZURE_STORAGE_ACCOUNT_NAME: this.dataStorageAccount.name,
    }
  }

  /**
   * @summary Method to create the data storage container
   */
  protected createDataStorageContainer() {
    if (!this.props.dataStorageContainer) return

    this.dataStorageContainer = this.storageManager.createStorageContainer(`${this.id}-data-storage-container`, this, {
      ...this.props.dataStorageContainer,
      accountName: this.dataStorageAccount.name,
      resourceGroupName: this.resourceGroup.name,
    })
  }

  /**
   * @summary Method to generate a SAS token for the storage container and store it in Key Vault
   */
  protected generateStorageContainerSas() {
    if (!this.props.dataStorageContainerSas) return

    const sasToken = this.storageManager.generateContainerSasToken(
      `${this.id}-storage-container`,
      this,
      this.props.dataStorageContainerSas,
      this.dataStorageAccount
    )

    const keyVault = this.keyVaultManager.createKeyVault(
      `${this.id}`,
      this,
      {
        vaultName: this.props.dataKeyVaultName,
        location: this.resourceGroup.location,
        resourceGroupName: this.resourceGroup.name,
        properties: {
          sku: {
            name: SkuName.Standard,
            family: SkuFamily.A,
          },
          tenantId: this.props.tenantId ?? '',
        },
      },
      { ignoreChanges: ['location'] }
    )
    this.dataKeyVault = keyVault

    this.monitorManager.createMonitorDiagnosticSettings(`${this.id}-${this.props.dataKeyVaultName}`, this, {
      name: `${this.props.dataKeyVaultName}-keyvault`,
      resourceUri: keyVault.id,
      workspaceId: this.commonLogAnalyticsWorkspace.id,
      logAnalyticsDestinationType: 'Dedicated',
      logs: [
        {
          categoryGroup: 'allLogs',
          enabled: true,
        },
      ],
      metrics: [
        {
          category: 'AllMetrics',
          enabled: true,
        },
      ],
    })

    this.keyVaultManager.createKeyVaultSecret(`${this.id}-sas-token-secret`, this, {
      vaultName: keyVault.name,
      secretName: this.props.dataKeyVaultSecretName,
      resourceGroupName: this.resourceGroup.name,
      properties: {
        value: sasToken,
      },
    })
  }

  /**
   * @summary Method to create and configure the function host.json
   */
  protected createFunctionHosts() {
    const currentDirectory = path.resolve(process.cwd(), '..')
    const hostsJsonFile = `${currentDirectory}/${this.props.functionApp.deploySource}/host.json`
    if (!fs.existsSync(hostsJsonFile)) return

    const sourceHostsConfig = JSON.parse(fs.readFileSync(hostsJsonFile).toString('utf-8'))
    const hostsConfig = _.merge(
      sourceHostsConfig,
      this.props.hostsConfiguration,
      this.props.functionApp.hostsConfiguration
    )
    fs.writeFileSync(hostsJsonFile, JSON.stringify(hostsConfig, null, 2))
  }

  /**
   * @summary Method to create the code package archive for deployment
   */
  protected createCodePackage() {
    const currentDirectory = path.resolve(process.cwd(), '..')
    this.appCodeArchiveFile = archive.getFileOutput({
      type: 'zip',
      sourceDir: `${currentDirectory}/${this.props.functionApp.deploySource}`,
      outputPath: `${currentDirectory}/${this.props.functionApp.deploySource}/${this.props.functionApp.packageName}`,
      excludes: ['*.zip'],
    })
  }

  /**
   * @summary Method to create the function app site configuration
   * - To be implemented in the overriding method in the implementation class
   */
  protected createFunctionAppSiteConfig() {}

  /**
   * @summary Method to create the Azure Function App with Flex Consumption hosting
   */
  protected createFunctionApp(resourceOptions?: ResourceOptions) {
    this.app = this.functionManager.createFunctionAppFlexConsumption(
      `${this.id}-function-app-flex`,
      this,
      {
        ...this.props.functionApp,
        name: this.props.functionApp.app?.name ?? this.id,
        scaleAndConcurrency: this.props.functionApp.app?.scaleAndConcurrency,
        serverFarmId: this.appServicePlan.id,
        resourceGroupName: this.resourceGroup.name,
        functionAppConfig: {
          deployment: {
            storage: {
              type: FunctionsDeploymentStorageType.BlobContainer,
              value: pulumi.interpolate`${this.appStorageAccount.primaryEndpoints.apply(e => e?.blob)}${this.appDeploymentStorageContainer.name}`,
              authentication: {
                type: AuthenticationType.StorageAccountConnectionString,
                storageAccountConnectionStringName: 'DEPLOYMENT_STORAGE_CONNECTION_STRING',
              },
            },
          },
        },
        siteConfig: {
          appSettings: [
            ..._.map(this.appEnvironmentVariables, (value, name) => ({ name, value })),
            {
              name: 'APPLICATIONINSIGHTS_CONNECTION_STRING',
              value: this.applicationInsights.connectionString,
            },
            {
              name: 'APPINSIGHTS_INSTRUMENTATIONKEY',
              value: this.applicationInsights.instrumentationKey,
            },
            {
              name: 'DEPLOYMENT_STORAGE_CONNECTION_STRING',
              value: pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${this.appStorageAccount.name};AccountKey=${
                listStorageAccountKeysOutput({
                  resourceGroupName: this.resourceGroup.name,
                  accountName: this.appStorageAccount.name,
                }).keys[0].value
              };EndpointSuffix=core.windows.net`,
            },
            {
              name: 'AzureWebJobsStorage',
              value: pulumi.interpolate`DefaultEndpointsProtocol=https;AccountName=${this.appStorageAccount.name};AccountKey=${
                listStorageAccountKeysOutput({
                  resourceGroupName: this.resourceGroup.name,
                  accountName: this.appStorageAccount.name,
                }).keys[0].value
              };EndpointSuffix=core.windows.net`,
            },
          ],
          connectionStrings: Object.fromEntries(
            this.appConnectionStrings.map(cs => [cs.name, { type: cs.type, value: cs.value }])
          ),
        },
        httpsOnly: this.props.functionApp.app?.httpsOnly ?? true,
      },
      { ...resourceOptions }
    )
  }

  /**
   * @summary Method to get the function app managed identity principal ID
   */
  protected getFunctionAppPrincipalId(): Output<string> {
    return this.app.identity.apply(identity => (identity?.principalId ? identity.principalId : ''))
  }

  /**
   * @summary Method to create role assignments for the function app identity
   */
  protected createRoleAssignments() {
    if (this.props.dataStorageAccount) {
      this.authorisationManager.grantRoleAssignmentToStorageAccount(
        `${this.id}-data`,
        this,
        this.dataStorageAccount.id,
        this.getFunctionAppPrincipalId(),
        PrincipalType.ServicePrincipal,
        this.authorisationManager.resolveRoleDefinitionId(this, RoleDefinitionId.STORAGE_BLOB_DATA_CONTRIBUTOR)
      )
    }

    this.authorisationManager.grantRoleAssignmentToStorageAccount(
      this.id,
      this,
      this.appStorageAccount.id,
      this.getFunctionAppPrincipalId(),
      PrincipalType.ServicePrincipal,
      this.authorisationManager.resolveRoleDefinitionId(this, RoleDefinitionId.STORAGE_BLOB_DATA_CONTRIBUTOR)
    )

    if (!this.props.useConfigOverride) {
      this.authorisationManager.grantRoleAssignmentToApplicationConfiguration(
        this.id,
        this,
        this.appConfig.id,
        this.getFunctionAppPrincipalId(),
        PrincipalType.ServicePrincipal,
        this.authorisationManager.resolveRoleDefinitionId(this, RoleDefinitionId.APP_CONFIGURATION_DATA_READER)
      )
    }

    if (
      this.appConfigurationsParsedConfig &&
      AzureAppConfigurationManager.hasCosmosDependencies(this.appConfigurationsParsedConfig)
    ) {
      this.cosmosDbManager.grantSqlRoleDefinitionToAccount(
        this.id,
        this,
        this.props.existingCosmosAccountName,
        this.props.existingCosmosAccountResourceGroupName,
        this.getFunctionAppPrincipalId(),
        [CosmosRoleDefinition.CONTRIBUTOR, CosmosRoleDefinition.READER]
      )
    }

    if (this.appKeyVaultsByResourceGroup && this.appKeyVaultsByResourceGroup.size > 0) {
      this.appKeyVaultsByResourceGroup.forEach((keyVaultNames, resourceGroup) => {
        keyVaultNames.forEach(keyVaultName => {
          this.authorisationManager.grantRoleAssignmentToKeyVault(
            this.id,
            this,
            keyVaultName,
            resourceGroup,
            this.getFunctionAppPrincipalId(),
            PrincipalType.ServicePrincipal,
            this.authorisationManager.resolveRoleDefinitionId(this, RoleDefinitionId.KEY_VAULT_SECRETS_USER)
          )
        })
      })
    }

    if (AzureAppConfigurationManager.hasEventGridTargets(this.appConfigurationsParsedConfig)) {
      this.authorisationManager.grantRoleAssignmentToEventgridTopic(
        this.id,
        this,
        this.props.existingTopicName,
        this.props.existingTopicResourceGroupName,
        this.getFunctionAppPrincipalId(),
        PrincipalType.ServicePrincipal,
        this.authorisationManager.resolveRoleDefinitionId(this, RoleDefinitionId.EVENTGRID_DATA_SENDER)
      )
    }
  }

  /**
   * @summary Method to get the dashboard template variables
   */
  protected dashboardVariables(): Record<string, any> {
    return {
      displayName: this.props.functionApp.dashboard.displayName,
      name: this.id,
      subscriptionId: this.props.subscriptionId,
      functionAppName: this.app.name,
      functionAppResourceGroupName: this.resourceGroup.name,
      insightsAppName: this.applicationInsights.name,
      insightsAppResourceGroupName: this.props.commonLogAnalyticsWorkspace?.resourceGroupName,
    }
  }

  /**
   * @summary Method to create the Azure Portal dashboard for the function app
   */
  protected createFunctionDashboard(): void {
    if (!this.props.functionApp.dashboard?.enabled) return

    this.functionDashboard = this.portalManager.createDashBoard(`${this.id}-dsh`, this, {
      displayName: this.props.functionApp.dashboard.displayName,
      location: this.props.locationConfig?.[this.props.location].name,
      dashboardName: this.id,
      resourceGroupName: this.resourceGroup.name,
      variables: this.dashboardVariables(),
      panes: this.props.functionApp.dashboard.panes,
      properties: this.appConfigurationsOriginalParsedConfig?.appConfig,
    })
  }
}
