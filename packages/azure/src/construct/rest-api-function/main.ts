import { HostnameType, NamedValue, PolicyContentFormat } from '@pulumi/azure-native/apimanagement/index.js'
import { getVaultOutput } from '@pulumi/azure-native/keyvault/index.js'
import { listWebAppHostKeys } from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import _ from 'lodash'

import { ApiManagementApiOperationProps, RoleDefinitionId } from '../../services/index.js'
import { AzureFunctionApp } from '../function-app/index.js'

import { AzureApiFunction, AzureRestApiFunctionProps } from './types.js'

/**
 * Provides a construct to create and deploy an Azure Function App with API Management integration
 * @example
 * import { AzureRestApiFunction, AzureRestApiFunctionProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends AzureRestApiFunction {
 *   constructor(id: string, props: AzureRestApiFunctionProps) {
 *     super(id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class AzureRestApiFunction extends AzureFunctionApp {
  props: AzureRestApiFunctionProps
  api: AzureApiFunction = {} as AzureApiFunction

  /**
   * @summary Create a new AzureRestApiFunction
   * @param id scoped id of the resource
   * @param props the REST API function properties
   */
  constructor(id: string, props: AzureRestApiFunctionProps) {
    super(id, props)
    this.props = props
    this.id = id
    this.api.apiOperations = {}
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
    this.resolveApiKeyVault()
    this.createNamespaceSecret()
    this.createApiManagement()
    this.createApiManagementNamespace()
    this.createApiManagementRoutes()
    this.createCorsPolicy()
    this.createFunctionDashboard()
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
   * @summary Method to create the namespace secret in Key Vault for the function app host key
   */
  protected createNamespaceSecret() {
    if (!this.props.apiManagement.useExistingApiManagement) return

    // Fetch function host keys with retry — the runtime may not be ready immediately after code deployment
    const functionKey = pulumi.all([this.app.name, this.resourceGroup.name]).apply(async ([appName, rgName]) => {
      if (pulumi.runtime.isDryRun()) return 'previewing'
      const maxRetries = 10
      const delayMs = 15000
      for (let i = 0; i < maxRetries; i++) {
        try {
          const keys = await listWebAppHostKeys({ name: appName, resourceGroupName: rgName })
          const defaultKey = keys.functionKeys?.['default']
          if (defaultKey) return defaultKey
        } catch {
          // runtime not ready yet
        }
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
      throw new Error(`Failed to retrieve function host keys for ${appName} after ${maxRetries} attempts`)
    })

    this.api.namedValueSecret = this.keyVaultManager.createKeyVaultSecret(
      `${this.id}-key-vault-api-namespace-secret`,
      this,
      {
        vaultName: this.api.authKeyVault.name,
        secretName: pulumi.interpolate`${this.app.name}key`,
        resourceGroupName: this.props.apiAuthKeyVault.resourceGroupName,
        properties: {
          value: functionKey,
          attributes: {
            enabled: true,
          },
          contentType: '',
        },
      }
    )
  }

  /**
   * @summary Method to create or resolve an existing API Management service
   */
  protected createApiManagement() {
    if (this.props.apiManagement.useExistingApiManagement) {
      if (this.props.apiManagement.apiStackName) {
        const apiStack = new pulumi.StackReference(this.props.apiManagement.apiStackName)
        const stackOutputs = apiStack.getOutput('stackOutputs')
        this.api.id = stackOutputs.apply(o => o.apiId)
        this.api.name = stackOutputs.apply(o => o.apiName)
        this.api.resourceGroupName = stackOutputs.apply(o => o.resourceGroupName)
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

      if (this.props.apiManagement.certificateKeyVaultId) {
        this.authorisationManager.createRoleAssignment(`${this.id}-kv-role`, this, {
          principalId: this.api.apim.identity.apply(identity => identity?.principalId ?? ''),
          roleDefinitionId: this.authorisationManager.resolveRoleDefinitionId(
            this,
            RoleDefinitionId.KEY_VAULT_CERTIFICATE_USER
          ),
          scope: this.props.apiManagement.certificateKeyVaultId,
        })
      }
    }
  }

  /**
   * @summary Method to create the API Management named value and backend for the function app
   */
  protected createApiManagementNamespace() {
    this.api.namedValue = new NamedValue(
      `${this.id}-am-nv`,
      {
        displayName: this.app.name,
        keyVault: {
          secretIdentifier: this.api.namedValueSecret.properties.apply(p => p.secretUri),
        },
        resourceGroupName: this.api.resourceGroupName,
        secret: true,
        serviceName: this.api.name,
      },
      { parent: this }
    )

    this.api.backend = this.apiManagementManager.createBackend(this.id, this, {
      ...this.props.apiManagementBackend,
      backendId: this.id,
      title: this.id,
      resourceGroupName: this.api.resourceGroupName,
      serviceName: this.api.name,
      url: pulumi.interpolate`https://${this.app.name}.azurewebsites.net/${this.props.apiManagementBackend.backendUrlPath}`,
      resourceId: pulumi.interpolate`https://management.azure.com/subscriptions/${this.props.subscriptionId}/resourceGroups/${this.resourceGroup.name}/providers/Microsoft.Web/sites/${this.app.name}`,
      credentials: {
        header: {
          'x-functions-key': [pulumi.interpolate`{{${this.api.namedValue.name}}}`],
        },
      },
    })
  }

  /**
   * @summary Method to create the API Management API and operation routes
   */
  protected createApiManagementRoutes() {
    this.api.managementApi = this.apiManagementManager.createApi(`${this.id}-apim-api`, this, {
      ...this.props.apiManagementApi,
      apiId: this.id,
      displayName: this.props.apiManagementApi.displayName ?? this.id,
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

  /**
   * @summary Method to create an API Management API operation
   */
  protected createApiOperation(operation: ApiManagementApiOperationProps) {
    this.api.apiOperations[operation.displayName.toString()] = this.apiManagementManager.createOperation(
      `${this.id}-apim-api-apim-api-operation-${operation.displayName}-${operation.method}`,
      this,
      {
        operationId: `${operation.displayName}-${operation.method}`,
        method: operation.method.toString().toUpperCase(),
        serviceName: this.api.name,
        resourceGroupName: this.api.resourceGroupName,
        apiId: this.resourceNameFormatter.format(this.id, this.props.resourceNameOptions?.apiManagementApi),
        displayName: operation.displayName,
        urlTemplate: operation.urlTemplate,
        templateParameters: operation.templateParameters,
      }
    )
  }

  /**
   * @summary Method to create a cache policy for an API Management API operation
   */
  protected createApiOperationCachePolicy(operation: ApiManagementApiOperationProps) {
    if (!operation.caching || !operation.caching.enableCacheSet) return

    this.apiManagementManager.createOperationPolicy(
      `${this.id}-apim-api-operation-policy-${operation.displayName}-${operation.method}`,
      this,
      {
        apiId: this.resourceNameFormatter.format(this.id, this.props.resourceNameOptions?.apiManagementApi),
        resourceGroupName: this.api.resourceGroupName,
        serviceName: this.api.name,
        operationId: `${operation.displayName}-${operation.method}`,
        format: PolicyContentFormat.Rawxml,
        value: `
        <policies>
          <inbound>
            <base />
              ${this.props.apiManagementApi.cacheSetInboundPolicy ?? ''}
          </inbound>
          <backend>
            <base />
          </backend>
          <outbound>
            <base />
              ${this.props.apiManagementApi.cacheSetOutboundPolicy ?? ''}
          </outbound>
          <on-error>
            <base />
          </on-error>
        </policies>`.replace(/\n[ \t]*\n/g, '\n'),
      }
    )
  }

  /**
   * @summary Method to create the CORS policy for API Management
   */
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

  /**
   * @summary Method to create the API-level policy for API Management with backend routing and tracing
   */
  protected createApiPolicy() {
    const policyXmlContent = pulumi.interpolate`
      <policies>
        <inbound>
          <base />
          ${this.api.corsPolicyXmlContent ?? ''}
          ${this.api.validateJwtPolicyXmlContent ?? ''}
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
      apiId: this.resourceNameFormatter.format(this.id, this.props.resourceNameOptions?.apiManagementApi),
      resourceGroupName: this.api.resourceGroupName,
      format: PolicyContentFormat.Rawxml,
      value: policyXmlContent.apply(xml => xml.replace(/\n[ \t]*\n/g, '\n')),
    })
  }

  /**
   * @summary Method to get the dashboard template variables including API Management name
   */
  protected dashboardVariables(): Record<string, any> {
    const variables = super.dashboardVariables()
    return {
      ...variables,
      apimName: this.api.name,
    }
  }
}
