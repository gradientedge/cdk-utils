import * as archive from '@pulumi/archive'
import {
  ConfigurationStore,
  getConfigurationStoreOutput,
  GetConfigurationStoreResult,
} from '@pulumi/azure-native/appconfiguration/index.js'
import { getComponentOutput, GetComponentResult } from '@pulumi/azure-native/applicationinsights/index.js'
import { SkuFamily, SkuName } from '@pulumi/azure-native/keyvault/index.js'
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
import fs from 'fs'
import _ from 'lodash'
import * as path from 'path'
import { CommonAzureConstruct } from '../../common/index.js'
import { CosmosRoleDefinition } from '../../services/cosmosdb/constants.js'
import { AzureAppConfigurationManager, RoleDefinitionId } from '../../services/index.js'
import { AzureFunctionAppProps } from './types.js'

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
  appKeyVaultsByResourceGroup: Map<string, Set<string>>
  appConnectionStrings: any[]
  appConfigPrefix?: string
  appConfigurationsParsedConfig: any
  appConfigurationsOriginalParsedConfig: any

  dataStorageAccount: StorageAccount
  dataStorageContainer: BlobContainer

  applicationInsights: Output<GetComponentResult>
  // functionAppRegistration: ApplicationRegistration
  functionDashboard: Dashboard

  constructor(id: string, props: AzureFunctionAppProps) {
    super(id, props)
    this.props = props
    this.id = id
  }

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
    // this.createFunctionAppAuthentication()
    this.createFunctionApp()
    this.createRoleAssignments()
    this.createFunctionDashboard()
  }

  protected resolveApplicationInsights() {
    if (!this.props.commonApplicationInsights || !this.props.commonApplicationInsights.resourceName) return

    this.applicationInsights = getComponentOutput({
      resourceName: this.props.commonApplicationInsights.resourceName,
      resourceGroupName: this.props.commonApplicationInsights.resourceGroupName,
    })
  }

  protected createAppServicePlan() {
    this.appServicePlan = this.appServiceManager.createAppServicePlan(`${this.id}-app-service-plan`, this, {
      ...this.props.functionApp.servicePlan,
      name: this.id,
      resourceGroupName: this.resourceGroup.name,
      location: this.resourceGroup.location,
    })
  }

  protected createdParsedAppConfigurations() {}

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

  protected createAppConfigurations() {}

  protected createStorageAccount() {
    this.appStorageAccount = this.storageManager.createStorageAccount(`${this.id}-storage-account`, this, {
      ...this.props.functionApp.storageAccount,
      location: this.resourceGroup.location,
      resourceGroupName: this.resourceGroup.name,
    })
  }

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

  protected createDataStorageContainer() {
    if (!this.props.dataStorageContainer) return

    this.dataStorageContainer = this.storageManager.createStorageContainer(`${this.id}-data-storage-container`, this, {
      ...this.props.dataStorageContainer,
      accountName: this.dataStorageAccount.name,
      resourceGroupName: this.resourceGroup.name,
    })
  }

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

  protected createFunctionHosts() {
    const currentDirectory = path.resolve()
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

  protected createCodePackage() {
    const currentDirectory = path.resolve()
    this.appCodeArchiveFile = archive.getFileOutput({
      type: 'zip',
      sourceDir: `${currentDirectory}/${this.props.functionApp.deploySource}`,
      outputPath: `${currentDirectory}/${this.props.functionApp.deploySource}/${this.props.functionApp.packageName}`,
      excludes: ['*.zip'],
    })
  }

  protected createFunctionAppSiteConfig() {}

  /* protected createFunctionAppAuthentication() {
    if (this.props.functionFunctionApp?.authSettingsV2?.authEnabled === true) {
      new AzureadProvider(this, `${this.id}-azuread-provider`, this.props)

      // Creates the app registration
      this.functionAppRegistration = new ApplicationRegistration(this, `${this.id}-app-registration`, {
        displayName: `RTP-${this.id.toUpperCase()}-${this.props.stage.toUpperCase()}`,
      })

      new ApplicationIdentifierUri(this, `${this.id}-app-identifier-uri`, {
        applicationId: this.functionAppRegistration.id,
        identifierUri: `api://${this.functionAppRegistration.clientId}`,
      })

      // Use a managed identity instead of a secret (preview)
      // https://learn.microsoft.com/en-us/azure/app-service/configure-authentication-provider-aad?tabs=workforce-configuration#use-a-managed-identity-instead-of-a-secret-preview
      // Step 1 : Create a user-assigned managed identity resource
      const userAssignedIdentity = new UserAssignedIdentity(this, `${this.id}-user-assigned-identity`, {
        location: this.props.location,
        resourceGroupName: this.resourceGroup.name,
        name: this.resourceNameFormatter.format(
          `${this.id}`,
          this.props.resourceNameOptions?.userAssignedIdentity
        ),
      })

      // Step 2 : Assign that identity to your Azure Functions resource
      this.props.functionFunctionApp = {
        ...this.props.functionFunctionApp,
        identity: {
          type: 'SystemAssigned, UserAssigned',
          identityIds: [userAssignedIdentity.id],
        },
      }

      // Step 4 : Configure a federated identity credential
      new ApplicationFederatedIdentityCredential(this, `${this.id}-federated-identity-credential`, {
        applicationId: this.functionAppRegistration.id,
        displayName: `${this.props.stage}-federated-id`,
        issuer: `https://login.microsoftonline.com/${this.props.tenantId}/v2.0`,
        audiences: ['api://AzureADTokenExchange'],
        subject: userAssignedIdentity.id,
      })

      // Step 5 : Add a new application setting named OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID
      this.functionFunctionAppEnvironmentVariables = {
        ...this.functionFunctionAppEnvironmentVariables,
        OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID: userAssignedIdentity.clientId,
      }

      // Step 5 : In the built-in authentication settings for your app resource, set Client secret setting name to OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID
      this.props.functionFunctionApp = {
        ...this.props.functionFunctionApp,
        name: this.id,
        stickySettings: {
          appSettingNames: ['OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID'],
        },
        authSettingsV2: {
          ...this.props.functionFunctionApp?.authSettingsV2,
          unauthenticatedAction: 'Return401',
          requireAuthentication: true,
          runtimeVersion: '~1',
          activeDirectoryV2: {
            clientId: this.functionAppRegistration.clientId,
            clientSecretSettingName: 'OVERRIDE_USE_MI_FIC_ASSERTION_CLIENTID',
            allowedAudiences: [`api://${this.functionAppRegistration.clientId}`],
            tenantAuthEndpoint: `https://sts.windows.net/${this.props.tenantId}/v2.0`,
          },
          login: {
            tokenStoreEnabled: true,
          },
        },
      }
    }
  } */

  protected createFunctionApp(resourceOptions?: ResourceOptions) {
    this.app = this.functionManager.createFunctionAppFlexConsumption(
      `${this.id}-function-app-flex`,
      this,
      {
        ...this.props.functionApp,
        name: this.props.functionApp.app.name ?? this.id,
        serverFarmId: this.appServicePlan.id,
        resourceGroupName: this.resourceGroup.name,
        functionAppConfig: {
          deployment: {
            storage: {
              type: FunctionsDeploymentStorageType.BlobContainer,
              value: pulumi.interpolate`${this.appStorageAccount.primaryEndpoints.apply(e => e?.blob)}${this.appDeploymentStorageContainer.name}`,
              authentication: {
                type: AuthenticationType.StorageAccountConnectionString,
                storageAccountConnectionStringName: 'AzureWebJobsStorage',
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
        httpsOnly: this.props.functionApp.app.httpsOnly ?? true,
      },
      { ...resourceOptions }
    )
  }

  protected getFunctionAppPrincipleId(): string {
    const identity = this.app.identity.get()
    return identity?.principalId ? identity.principalId : ''
  }

  protected createRoleAssignments() {
    if (this.props.dataStorageAccount) {
      this.authorisationManager.grantRoleAssignmentToStorageAccount(
        `${this.id}-data`,
        this,
        this.dataStorageAccount.id.get(),
        this.getFunctionAppPrincipleId(),
        RoleDefinitionId.STORAGE_BLOB_DATA_CONTRIBUTOR
      )
    }

    this.authorisationManager.grantRoleAssignmentToStorageAccount(
      this.id,
      this,
      this.appStorageAccount.id.get(),
      this.getFunctionAppPrincipleId(),
      RoleDefinitionId.STORAGE_BLOB_DATA_CONTRIBUTOR
    )

    if (!this.props.useConfigOverride) {
      this.authorisationManager.grantRoleAssignmentToApplicationConfiguration(
        this.id,
        this,
        this.appConfig.id.get(),
        this.getFunctionAppPrincipleId(),
        RoleDefinitionId.APP_CONFIGURATION_DATA_READER
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
        this.getFunctionAppPrincipleId(),
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
            this.getFunctionAppPrincipleId(),
            RoleDefinitionId.KEY_VAULT_SECRETS_USER
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
        this.getFunctionAppPrincipleId(),
        RoleDefinitionId.EVENTGRID_DATA_SENDER
      )
    }
  }

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

  protected createFunctionDashboard(): void {
    if (!this.props.functionApp.dashboard?.enabled) return

    this.functionDashboard = this.portalManager.createDashBoard(`${this.id}-dsh`, this, {
      displayName: this.props.functionApp.dashboard.displayName,
      location: this.props.locationConfig?.[this.props.location].name,
      dashboardName: this.id,
      resourceGroupName: this.resourceGroup.name,
      variables: this.dashboardVariables(),
      panes: this.props.functionApp.dashboard.panes,
      properties: this.appConfigurationsOriginalParsedConfig.appConfig,
    })
  }
}
