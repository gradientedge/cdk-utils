import { HostnameType, NamedValue } from '@pulumi/azure-native/apimanagement/index.js'
import { getVaultOutput } from '@pulumi/azure-native/keyvault/index.js'
import { listWebAppHostKeysOutput } from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import _ from 'lodash'
import { ApiManagementApiOperationProps, RoleDefinitionId } from '../../services/index.js'
import { AzureFunctionApp } from '../function-app/index.js'
import { AzureApiFunction, AzureRestApiFunctionProps } from './types.js'

export class AzureRestApiFunction extends AzureFunctionApp {
  props: AzureRestApiFunctionProps
  api: AzureApiFunction

  constructor(id: string, props: AzureRestApiFunctionProps) {
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
    this.resolveApiKeyVault()
    this.createNamespaceSecret()
    this.createApiManagement()
    this.createApiManagementNamespace()
    this.createApiManagementRoutes()
    this.createCorsPolicy()
    this.createFunctionDashboard()
  }

  protected resolveApiKeyVault() {
    this.api.authKeyVault = getVaultOutput({
      vaultName: this.props.apiAuthKeyVault.name,
      resourceGroupName: this.props.apiAuthKeyVault.resourceGroupName,
    })
  }

  protected createNamespaceSecret() {
    if (!this.props.apiManagement.useExistingApiManagement) return

    const functionDefaultKey = listWebAppHostKeysOutput({
      name: this.app.name,
      resourceGroupName: this.resourceGroup.name,
    })

    this.api.namedValueSecret = this.keyVaultManager.createKeyVaultSecret(
      `${this.id}-key-vault-api-namespace-secret`,
      this,
      {
        vaultName: this.api.authKeyVault.name,
        secretName: pulumi.interpolate`${this.app.name}key`,
        resourceGroupName: this.resourceGroup.name,
        properties: {
          value: functionDefaultKey.functionKeys?.apply(keys => keys?.['default'] ?? ''),
        },
      }
    )
  }

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
            type: HostnameType.Management,
          },
        ]
      }

      this.api.apim = this.apiManagementManager.createApiManagementService(
        this.id,
        this,
        {
          ...this.props.apiManagement,
          serviceName: this.props.stackName,
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

      if (this.props.apiManagement.certificateKeyVaultId) {
        this.authorisationManager.createRoleAssignment(`${this.id}-kv-role`, this, {
          principalId: this.api.apim.identity.apply(identity => identity?.principalId ?? ''),
          roleDefinitionId: RoleDefinitionId.KEY_VAULT_CERTIFICATE_USER,
          scope: this.props.apiManagement.certificateKeyVaultId,
        })
      }
    }
  }

  protected createApiManagementNamespace() {
    this.api.namedValue = new NamedValue(`${this.id}-am-nv`, {
      displayName: this.app.name,
      keyVault: {
        secretIdentifier: this.api.namedValueSecret.id,
      },
      resourceGroupName: this.api.resourceGroupName,
      secret: true,
      serviceName: this.api.name,
    })

    this.api.backend = this.apiManagementManager.createBackend(this.id, this, {
      ...this.props.apiManagementBackend,
      title: this.props.stackName,
      resourceGroupName: this.api.resourceGroupName,
      serviceName: this.api.name,
      url: pulumi.interpolate`https://${this.app.name}.azurewebsites.net/${this.props.apiManagementBackend.backendUrlPath}`,
      resourceId: pulumi.interpolate`https://management.azure.com/subscriptions/${this.props.subscriptionId}/resourceGroups/${this.resourceGroup.name}/providers/Microsoft.Web/sites/${this.app.name}`,
      credentials: {
        header: {
          'x-functions-key': [`{{${this.api.namedValue.name}}}`],
        },
      },
    })
  }

  protected createApiManagementRoutes() {
    this.api.managementApi = this.apiManagementManager.createApi(`${this.id}-apim-api`, this, {
      ...this.props.apiManagementApi,
      displayName: this.props.apiManagementApi.displayName ?? this.props.stackName,
      serviceName: this.api.name,
      resourceGroupName: this.api.resourceGroupName,
      isCurrent: this.props.apiManagementApi.isCurrent ?? true,
      protocols: this.props.apiManagementApi.protocols ?? ['https'],
    })

    _.forEach(this.props.apiManagementApi.operations, operation => {
      this.createApiOperation(operation)
      this.createApiOperationCachePolicy(operation)
    })
  }

  protected createApiOperation(operation: ApiManagementApiOperationProps) {
    this.api.apiOperations[operation.displayName.toString()] = this.apiManagementManager.createOperation(
      `${this.id}-apim-api-apim-api-operation-${operation.displayName}-${operation.method}`,
      this,
      {
        operationId: `${operation.displayName}-${operation.method}`,
        method: operation.method.toString().toUpperCase(),
        serviceName: this.api.name,
        resourceGroupName: this.api.resourceGroupName,
        apiId: this.api.id,
        displayName: operation.displayName,
        urlTemplate: operation.urlTemplate,
        templateParameters: operation.templateParameters,
      }
    )
  }

  protected createApiOperationCachePolicy(operation: ApiManagementApiOperationProps) {
    if (!operation.caching || !operation.caching.enableCacheSet) return

    this.apiManagementManager.createOperationPolicy(
      `${this.id}-apim-api-operation-policy-${operation.displayName}-${operation.method}`,
      this,
      {
        apiId: this.api.id,
        resourceGroupName: this.api.resourceGroupName,
        serviceName: this.api.name,
        operationId: `${operation.displayName}-${operation.method}`,
        value: `
        <policies>
          <policies>
            <inbound>
              <base />
                ${this.props.apiManagementApi.cacheSetInboundPolicy}
            </inbound>
            <backend>
              <base />
            </backend>
            <outbound>
              <base />
                ${this.props.apiManagementApi.cacheSetOutboundPolicy}
            </outbound>
            <on-error>
              <base />
            </on-error>
        </policies>`.replace(/\n[ \t]*\n/g, '\n'), // move to utils
      }
    )
  }

  protected createCorsPolicy() {
    if (!this.props.apiManagementCors?.enableCors) return

    const allowedOrigins: string[] = []
    if (this.props.apiManagementCors.allowedOrigins) {
      _.forEach(this.props.apiManagementCors.allowedOrigins, (origin: string) => {
        allowedOrigins.push(`<origin>${origin}</origin>`)
      })
    } else if (this.props.apiManagementCors.originSubdomain) {
      _.forEach(this.props.locales, (locale: string) => {
        allowedOrigins.push(
          `<origin>https://${this.props.apiManagementCors?.originSubdomain}-${locale}.${this.props.domainName}</origin>`
        )
      })

      // todo set in consumer
      /* isDevStage(this.props.stage) ? allowedOrigins.push('<origin>http://localhost:3000</origin>') : ''
      isDevStage(this.props.stage) ? allowedOrigins.push('<origin>http://localhost:5000</origin>') : ''
      isDevStage(this.props.stage) ? allowedOrigins.push('<origin>http://localhost:5001</origin>') : ''
      allowedOrigins.push('<origin>http://bs-local.com/</origin>') */
    }

    const allowedHeaders: string[] = []
    _.forEach(this.props.apiManagementCors.allowedHeaders, (header: string) => {
      allowedHeaders.push(`<header>${header}</header>`)
    })

    const allowedMethods: string[] = []
    _.forEach(this.props.apiManagementCors.allowedMethods, (method: string) => {
      allowedMethods.push(`<method>${method}</method>`)
    })

    this.api.corsPolicyXmlContent = `
        <cors allow-credentials="${this.props.apiManagementCors.allowCredentials}">
          <allowed-origins>
            ${allowedOrigins.toString().replaceAll(',', '')}
          </allowed-origins>
          <allowed-methods>
            ${allowedMethods.toString().replaceAll(',', '')}
          </allowed-methods>
          <allowed-headers>
            ${allowedHeaders.toString().replaceAll(',', '')}
          </allowed-headers>
        </cors>`.replace(/\n[ \t]*\n/g, '\n') // move to utils
  }

  /* protected createApiAuthenticationPolicy() {
    if (this.props.functionApp.app.authSettingsV2?.authEnabled === true) {
      this.apiManagementAuthenticationPolicyXmlContent = `<authentication-managed-identity resource="${this.functionAppRegistration.clientId}"
          output-token-variable-name="msi-access-token" ignore-error="false" />
        <set-header name="Authorization" exists-action="override">
          <value>@("Bearer " + (string)context.Variables["msi-access-token"])</value>
        </set-header>`
    }
  } */

  protected createApiPolicy() {
    const policyXmlContent = pulumi.interpolate`
      <policies>
        <inbound>
          <base />
          ${this.api.corsPolicyXmlContent ?? ''}
          <set-backend-service backend-id="${this.api.backend.name}" />
          <set-header name="traceparent" exists-action="override">
            <value>@(context.Request.Headers.GetValueOrDefault("traceparent", ""))</value>
          </set-header>
        </inbound>
        <backend>
            <base />
        </backend>
        <outbound>
          <base />
          <set-header name="traceparent" exists-action="override">
            <value>@(context.Request.Headers.GetValueOrDefault("traceparent", ""))</value>
          </set-header>
        </outbound>
        <on-error>
            <base />
        </on-error>
      </policies>`

    this.apiManagementManager.createPolicy(`${this.id}-apim-api-policy`, this, {
      serviceName: this.api.name,
      apiId: this.api.id,
      resourceGroupName: this.api.resourceGroupName,
      value: policyXmlContent.apply(xml => xml.replace(/\n[ \t]*\n/g, '\n')),
    })
  }

  protected dashboardVariables(): Record<string, any> {
    const variables = super.dashboardVariables()
    return {
      ...variables,
      apimName: this.api.name,
    }
  }
}
