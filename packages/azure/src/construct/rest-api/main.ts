import { getApiManagementServiceOutput, HostnameType, LoggerType } from '@pulumi/azure-native/apimanagement/index.js'
import { getComponentOutput, GetComponentResult } from '@pulumi/azure-native/applicationinsights/index.js'
import { PrincipalType } from '@pulumi/azure-native/authorization/index.js'
import { getVaultOutput } from '@pulumi/azure-native/keyvault/index.js'
import * as pulumi from '@pulumi/pulumi'
import { Output } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'
import { RoleDefinitionId } from '../../services/index.js'

import { AzureApi, AzureRestApiProps } from './types.js'

/**
 * Provides a construct to create and deploy an Azure API Management service with diagnostics and logging
 * @example
 * import { AzureRestApi, AzureRestApiProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends AzureRestApi {
 *   constructor(id: string, props: AzureRestApiProps) {
 *     super(id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class AzureRestApi extends CommonAzureConstruct {
  props: AzureRestApiProps
  api: AzureApi = {} as AzureApi
  applicationInsights: Output<GetComponentResult>

  constructor(id: string, props: AzureRestApiProps) {
    super(id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createResourceGroup()
    this.resolveApiKeyVault()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createApiManagement()
    this.createNamespaceSecretRole()
    this.createNamespaceSecret()
    this.createSubscriptionKeySecret()
    this.createApiManagementLogger()
    this.createApiDiagnostic()
    this.createDiagnosticLog()
  }

  /**
   * @summary Method to resolve the API authentication Key Vault
   */
  protected resolveApiKeyVault() {
    this.api.authKeyVault = getVaultOutput({
      vaultName: this.props.apiAuthKeyVault.name,
      resourceGroupName: this.props.apiAuthKeyVault.resourceGroupName,
    })
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
   * @summary Method to create or resolve an existing API Management service
   */
  protected createApiManagement() {
    if (this.props.apiManagement.useExistingApiManagement) {
      if (this.props.apiManagement.apiStackName) {
        const apiStack = new pulumi.StackReference(this.props.apiManagement.apiStackName)
        this.api.id = apiStack.getOutput('apiId')
        this.api.name = apiStack.getOutput('apiName')
        this.api.resourceGroupName = apiStack.getOutput('apiResourceGroupName')
      }
    } else {
      let hostnameConfigurations
      if (this.props.apiManagement.certificateKeyVaultId) {
        hostnameConfigurations = [
          {
            hostName: `api-${this.props.locationConfig?.[this.props.location].name}.${this.props.domainName}`,
            keyVaultId: this.props.apiManagement.certificateKeyVaultId,
            type: HostnameType.Proxy,
          },
        ]
      }

      this.api.apim = this.apiManagementManager.createApiManagementService(
        this.id,
        this,
        {
          ...this.props.apiManagement,
          serviceName: this.id,
          location: this.resourceGroup.location,
          resourceGroupName: this.resourceGroup.name,
          hostnameConfigurations,
        },
        undefined,
        undefined,
        { protect: true }
      )
      this.api.id = this.api.apim.id
      this.api.name = this.api.apim.name
      this.api.resourceGroupName = this.resourceGroup.name

      const apimIdentity = getApiManagementServiceOutput({
        serviceName: this.api.apim.name,
        resourceGroupName: this.resourceGroup.name,
      }).identity

      if (this.props.apiManagement.certificateKeyVaultId && apimIdentity) {
        this.authorisationManager.createRoleAssignment(`${this.id}-kv-role`, this, {
          principalId: apimIdentity.apply(id => id?.principalId ?? ''),
          roleDefinitionId: this.authorisationManager.resolveRoleDefinitionId(
            this,
            RoleDefinitionId.KEY_VAULT_CERTIFICATE_USER
          ),
          principalType: PrincipalType.ServicePrincipal,
          scope: this.props.apiManagement.certificateKeyVaultId,
        })
      }
    }

    this.registerOutputs({
      apiId: this.api.id,
      apiName: this.api.name,
      apiResourceGroupName: this.api.resourceGroupName,
    })
  }

  /**
   * @summary Method to create the Key Vault role assignment for the API Management identity
   */
  protected createNamespaceSecretRole() {
    if (this.props.apiManagement.useExistingApiManagement) return

    const apimIdentity = getApiManagementServiceOutput({
      serviceName: this.api.apim.name,
      resourceGroupName: this.resourceGroup.name,
    }).identity

    if (apimIdentity) {
      this.api.namedValueRoleAssignment = this.authorisationManager.createRoleAssignment(
        `${this.id}-key-vault-role-api-namespace`,
        this,
        {
          principalId: apimIdentity.apply(id => id?.principalId ?? ''),
          principalType: PrincipalType.ServicePrincipal,
          roleDefinitionId: this.authorisationManager.resolveRoleDefinitionId(
            this,
            RoleDefinitionId.KEY_VAULT_SECRETS_USER
          ),
          scope: this.api.authKeyVault.id,
        }
      )
    }
  }

  /**
   * @summary Method to create the namespace secret in Key Vault for Application Insights
   */
  protected createNamespaceSecret() {
    if (this.props.apiManagement.useExistingApiManagement) return

    this.api.namedValueSecret = this.keyVaultManager.createKeyVaultSecret(
      `${this.id}-key-vault-api-namespace-secret`,
      this,
      {
        vaultName: this.api.authKeyVault.name,
        secretName: pulumi.interpolate`${this.applicationInsights.name}-${this.id}-key`,
        resourceGroupName: this.props.apiAuthKeyVault.resourceGroupName,
        properties: {
          value: this.applicationInsights.instrumentationKey,
        },
      }
    )
  }

  /**
   * @summary Method to create the API Management subscription and store the key in Key Vault
   */
  protected createSubscriptionKeySecret() {
    if (this.props.apiManagement.useExistingApiManagement) return

    const apiManagementSubscription = this.apiManagementManager.createSubscription(this.id, this, {
      serviceName: this.api.apim.name,
      resourceGroupName: this.resourceGroup.name,
      displayName: 'all-apis',
      state: 'active',
      allowTracing: false,
      scope: '/apis',
    })

    this.keyVaultManager.createKeyVaultSecret(`${this.id}-key-vault-api-subscription-key-secret`, this, {
      vaultName: this.api.authKeyVault.name,
      secretName: `${this.id}-subscription-key`,
      resourceGroupName: this.props.apiAuthKeyVault.resourceGroupName,
      properties: {
        value: apiManagementSubscription.primaryKey.apply(key => key ?? ''),
      },
    })
  }

  /**
   * @summary Method to create the API Management logger with Application Insights integration
   */
  protected createApiManagementLogger() {
    if (this.props.apiManagement.useExistingApiManagement) return

    const apiAppNamedValue = this.apiManagementManager.createNamedValue(`${this.id}-am-nv`, this, {
      displayName: this.applicationInsights.name,
      resourceGroupName: this.resourceGroup.name,
      serviceName: this.api.apim.name,
      namedValueId: pulumi.interpolate`${this.applicationInsights.name}-key`,
      secret: true,
      keyVault: {
        secretIdentifier: this.api.namedValueSecret.properties.apply(p => p.secretUri),
      },
    })

    this.api.logger = this.apiManagementManager.createLogger(
      `${this.id}-am-logger`,
      this,
      {
        loggerId: this.applicationInsights.name,
        resourceGroupName: this.resourceGroup.name,
        serviceName: this.api.apim.name,
        resourceId: this.applicationInsights.id,
        loggerType: LoggerType.ApplicationInsights,
        credentials: {
          instrumentationKey: pulumi.interpolate`{{${apiAppNamedValue.displayName}}}`,
        },
      },
      { dependsOn: [apiAppNamedValue] }
    )
  }

  /**
   * @summary Method to create the API diagnostic settings for API Management
   */
  protected createApiDiagnostic() {
    if (this.props.apiManagement.useExistingApiManagement) return

    this.apiManagementManager.createApiDiagnostic(`${this.id}-all-apis`, this, {
      ...this.props.apiManagementDiagnostic,
      apiId: this.api.apim.id,
      resourceGroupName: this.resourceGroup.name,
      serviceName: this.api.apim.name,
      loggerId: this.api.logger.id,
    })
  }

  /**
   * @summary Method to create the Monitor diagnostic log settings for API Management
   */
  protected createDiagnosticLog() {
    if (this.props.apiManagement.useExistingApiManagement) return

    this.monitorManager.createMonitorDiagnosticSettings(`${this.id}-apim-diagnostic`, this, {
      ...this.props.apiManagementDiagnosticSettings,
      name: `${this.id}-api-management`,
      resourceUri: this.api.apim.id,
      workspaceId: this.commonLogAnalyticsWorkspace.id,
    })
  }
}
