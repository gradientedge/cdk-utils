import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import {
  DataAzurermApiManagement,
  DataAzurermApiManagementConfig,
} from '@cdktf/provider-azurerm/lib/data-azurerm-api-management'
import { ApiManagementCustomDomain } from '@cdktf/provider-azurerm/lib/api-management-custom-domain'
import { ApiManagement } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementApi } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementApiOperation } from '@cdktf/provider-azurerm/lib/api-management-api-operation'
import { ApiManagementApiOperationPolicy } from '@cdktf/provider-azurerm/lib/api-management-api-operation-policy'
import {
  ApiManagementLogger,
  ApiManagementLoggerApplicationInsights,
} from '@cdktf/provider-azurerm/lib/api-management-logger'
import { ApiManagementRedisCache } from '@cdktf/provider-azurerm/lib/api-management-redis-cache'
import { RedisCache } from '@cdktf/provider-azurerm/lib/redis-cache'
import { Resource } from '../../.gen/providers/azapi/resource'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import {
  ApiManagementProps,
  ApiManagementBackendProps,
  ApiManagementApiProps,
  ApiManagementCustomDomainProps,
  ApiManagementRedisCacheProps,
} from './types'
import _ from 'lodash'

/**
 * @classdesc Provides operations on Azure Api Management
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.apiManagementManager.createApiManagement('MyApiManagement', this, props)
 *   }
 * }
 * ```
 */
export class AzureApiManagementManager {
  /**
   * @summary Method to create a new api management
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management properties
   * @see [CDKTF Api management Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/apiManagement.typescript.md}
   */
  public createApiManagement(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementProps,
    applicationInsightsKey?: ApiManagementLoggerApplicationInsights['instrumentationKey'],
    externalRedisCache?: RedisCache
  ) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-am-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const apiManagement = new ApiManagement(scope, `${id}-am`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.apiManagement),
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    if (applicationInsightsKey) {
      new ApiManagementLogger(scope, `${id}-am-logger`, {
        name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.apiManagementLogger),
        resourceGroupName: resourceGroup.name,
        apiManagementName: apiManagement.name,
        applicationInsights: {
          instrumentationKey: applicationInsightsKey,
        },
      })
    }

    if (externalRedisCache) {
      new ApiManagementRedisCache(scope, `${id}-am-redis-cache`, {
        name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.apiManagementRedisCache),
        apiManagementId: apiManagement.id,
        connectionString: externalRedisCache.primaryConnectionString,
        cacheLocation: externalRedisCache.location,
        redisCacheId: externalRedisCache.id,
      })
    }

    createAzureTfOutput(`${id}-apiManagementName`, scope, apiManagement.name)
    createAzureTfOutput(`${id}-apiManagementFriendlyUniqueId`, scope, apiManagement.friendlyUniqueId)
    createAzureTfOutput(`${id}-apiManagementId`, scope, apiManagement.id)

    return apiManagement
  }

  /**
   * @summary Method to resolve an api management
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management properties
   * @see [CDKTF Api management Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/apiManagement.typescript.md}
   */
  public resolveApiManagement(id: string, scope: CommonAzureConstruct, props: DataAzurermApiManagementConfig) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-am-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const apiManagement = new DataAzurermApiManagement(scope, `${id}-am`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.dataAzurermApiManagement),
      resourceGroupName: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    return apiManagement
  }

  /**
   * @summary Method to create a new api management backend
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management backend properties
   * @see [CDKTF Api management Backend Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/ApiManagementBackend.typescript.md}
   */
  public createApiManagementBackend(id: string, scope: CommonAzureConstruct, props: ApiManagementBackendProps) {
    if (!props) throw `Props undefined for ${id}`

    //    Commenting as circuit breaker config is currently not supported
    /*
    const apiManagementBackend = new ApiManagementBackend(scope, `${id}-am-be`, {
          ...props,
          name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.apiManagementBackend),
          description: props.description ?? `Backend for ${props.name}-${scope.props.stage}`,
          protocol: props.protocol ?? 'http',
        })
*/

    const apiManagementBackend = new Resource(scope, `${id}-am-be`, {
      type: 'Microsoft.ApiManagement/service/backends@2024-06-01-preview',
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.apiManagementBackend),
      parentId: props.apiManagementId,

      body: {
        properties: {
          circuitBreaker: props.circuitBreaker,
          credentials: props.credentials,
          description: props.description ?? `Backend for ${props.name}-${scope.props.stage}`,
          url: props.url,
          resourceId: props.resourceId,
          protocol: props.protocol ?? 'http',
        },
      },

      responseExportValues: ['*'],

      ignoreMissingProperty: true,
      ignoreCasing: true,
      schemaValidationEnabled: false,

      lifecycle: props.lifecycle,
    })

    createAzureTfOutput(`${id}-apiManagementBackendName`, scope, apiManagementBackend.name)
    createAzureTfOutput(`${id}-apiManagementBackendFriendlyUniqueId`, scope, apiManagementBackend.friendlyUniqueId)
    createAzureTfOutput(`${id}-apiManagementBackendId`, scope, apiManagementBackend.id)

    return apiManagementBackend
  }

  /**
   * @summary Method to create a new api management api
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management api properties
   * @see [CDKTF Api management Api Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/ApiManagementApi.typescript.md}
   */
  public createApiManagementApi(id: string, scope: CommonAzureConstruct, props: ApiManagementApiProps) {
    if (!props) throw `Props undefined for ${id}`

    const apiManagementApi = new ApiManagementApi(scope, `${id}-am-api`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.apiManagementApi),
      displayName: props.displayName ?? props.name,
      revision: props.revision ?? '1',
      protocols: props.protocols ?? ['https'],
    })

    createAzureTfOutput(`${id}-apiManagementApiName`, scope, apiManagementApi.name)
    createAzureTfOutput(`${id}-apiManagementApiFriendlyUniqueId`, scope, apiManagementApi.friendlyUniqueId)
    createAzureTfOutput(`${id}-apiManagementApiId`, scope, apiManagementApi.id)

    _.forEach(props.operations, operation => {
      const apimOperation = new ApiManagementApiOperation(
        scope,
        `${id}-apim-api-operation-${operation.displayName}-${operation.method}`,
        {
          operationId: `${operation.displayName}-${operation.method}`,
          method: operation.method.toUpperCase(),
          apiManagementName: apiManagementApi.apiManagementName,
          resourceGroupName: apiManagementApi.resourceGroupName,
          apiName: apiManagementApi.name,
          displayName: operation.displayName,
          urlTemplate: operation.urlTemplate,
          templateParameter: operation.templateParameter,
        }
      )

      createAzureTfOutput(
        `${id}-${operation.displayName}-${operation.method}-apimOperationOperationId`,
        scope,
        apimOperation.operationId
      )
      createAzureTfOutput(
        `${id}-${operation.displayName}-${operation.method}-apimOperationFriendlyUniqueId`,
        scope,
        apimOperation.friendlyUniqueId
      )
      createAzureTfOutput(`${id}-${operation.displayName}-${operation.method}-apimOperationId`, scope, apimOperation.id)

      // Define Caching Policy if enabled
      let cacheSetVariablePolicy = ''
      let cacheInvalidateInboundPolicy = ''
      let cacheSetInboundPolicy = ''
      let cacheSetOutboundPolicy = ''

      if (operation.caching) {
        cacheSetVariablePolicy = `<!-- Generate a comprehensive custom cache key (without query params or Accept header) -->
              <set-variable name="customCacheKey" value="@{
                  // Instance identification
                  
                  // API identification
                  string apiName = context.Api.Name.Replace(" ", "").ToLower();
                  string apiVersion = context.Api.Version ?? "v1";
                  
                  // Full path construction (without query parameters)
                  string fullPath = context.Request.Url.Path.ToLower();

                  // Query parameters
                  string query = context.Request.Url.QueryString.ToLower();

                  // Construct final cache key (no Accept header needed for JSON-only APIs)
                  return $"{apiName}:{apiVersion}:{fullPath}:{query}";
              }" />
              <set-variable name="bypassCache" value="@(context.Request.Headers.GetValueOrDefault("X-Cache-Bypass", "false").ToLower())" />`

        if (operation.caching.enableCacheSet) {
          cacheSetInboundPolicy = `<choose>
                  <when condition="@((string)context.Variables["bypassCache"] != "true")">
                      <!-- Attempt to retrieve cached response -->
                      <cache-lookup-value key="@((string)context.Variables["customCacheKey"])" variable-name="cachedResponse" />

                      <!-- If cache hit, return cached response -->
                      <choose>
                          <when condition="@(context.Variables.ContainsKey("cachedResponse"))">
                              <return-response>
                                  <set-status code="200" reason="OK" />
                                  <set-header name="Content-Type" exists-action="override">
                                      <value>application/json</value>
                                  </set-header>
                                  <set-header name="X-Apim-Cache-Status" exists-action="override">
                                      <value>HIT</value>
                                  </set-header>
                                  <set-header name="X-Apim-Cache-Key" exists-action="override">
                                      <value>@((string)context.Variables["customCacheKey"])</value>
                                  </set-header>
                                  <set-body>@((string)context.Variables["cachedResponse"])</set-body>
                              </return-response>
                          </when>
                      </choose>
                  </when>
                  <when condition="@((string)context.Variables["bypassCache"] == "true")">
                      <cache-remove-value key="@((string)context.Variables["customCacheKey"])" />
                  </when>
              </choose>`
          cacheSetOutboundPolicy = `<!-- Store the response body in cache -->
              <choose>
                  <when condition="@(context.Response.StatusCode == 200)">
                      <cache-store-value key="@((string)context.Variables["customCacheKey"])" value="@(context.Response.Body.As<string>(preserveContent: true))" duration="${operation.caching.ttlInSecs ?? 900}" />
                      <!-- Add cache status header -->
                      <set-header name="X-Apim-Cache-Status" exists-action="override">
                          <value>MISS</value>
                      </set-header>
                  </when>
              </choose>
              <!-- Add debug headers -->
              <set-header name="X-Apim-Cache-Key" exists-action="override">
                  <value>@((string)context.Variables["customCacheKey"])</value>
              </set-header>
              <set-header name="X-Apim-API-Name" exists-action="override">
                  <value>@(context.Api.Name)</value>
              </set-header>`
        }

        if (operation.caching.enableCacheInvalidation) {
          cacheInvalidateInboundPolicy = `<set-variable name="clearCache" value="@(context.Request.Headers.GetValueOrDefault("X-Apim-Clear-Cache", "false").ToLower())" />
              <!-- Allow admin to clear specific cache entries -->
              <choose>
                  <when condition="@((string)context.Variables["clearCache"] == "true")">
                      <cache-remove-value key="@((string)context.Variables["customCacheKey"])" />
                      <return-response>
                          <set-status code="200" reason="OK" />
                          <set-body>Cache entry removed successfully</set-body>
                      </return-response>
                  </when>
              </choose>`
        }
      }

      // Inject rate limiting policy (if configured)
      let rateLimitPolicy = ''
      if (props.rateLimit && scope.props.subscriptionId) {
        rateLimitPolicy = `<rate-limit-by-key calls="${props.rateLimit.calls}" renewal-period="${props.rateLimit.renewalPeriodInSecs}" counter-key="${scope.props.subscriptionId}-${apimOperation.operationId}"/>`
      }

      const policyXmlContent = `<policies>
        <inbound>
          <base />
          ${rateLimitPolicy}
          ${cacheSetVariablePolicy}
          ${cacheInvalidateInboundPolicy}
          ${cacheSetInboundPolicy}
          ${props.commonInboundPolicyXml ?? ''}
        </inbound>
        <backend>
          <base />
        </backend>
        <outbound>
          <base />
          ${cacheSetOutboundPolicy}
          ${props.commonOutboundPolicyXml ?? ''}
        </outbound>
        <on-error>
            <base />
        </on-error>
      </policies>`

      const apimOperationPolicy = new ApiManagementApiOperationPolicy(
        scope,
        `${id}-apim-api-operation-policy-${operation.displayName}-${operation.method}`,
        {
          apiManagementName: apiManagementApi.apiManagementName,
          resourceGroupName: apiManagementApi.resourceGroupName,
          apiName: apiManagementApi.name,
          operationId: apimOperation.operationId,
          xmlContent: policyXmlContent,
        }
      )

      createAzureTfOutput(
        `${id}-${operation.displayName}-${operation.method}-apimOperationPolicyFriendlyUniqueId`,
        scope,
        apimOperationPolicy.friendlyUniqueId
      )
      createAzureTfOutput(
        `${id}-${operation.displayName}-${operation.method}-apimOperationPolicyId`,
        scope,
        apimOperationPolicy.id
      )
    })

    return apiManagementApi
  }

  /**
   * @summary Method to create a new api management custom domain
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management custom domain properties
   * @see [CDKTF Api management Custom Domain Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/createApiManagementCustomDomain.typescript.md}
   */
  public createApiManagementCustomDomain(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementCustomDomainProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const apiManagementCustomDomain = new ApiManagementCustomDomain(scope, `${id}-am-cd`, props)

    createAzureTfOutput(
      `${id}-apiManagementCustomDomainFriendlyUniqueId`,
      scope,
      apiManagementCustomDomain.friendlyUniqueId
    )
    createAzureTfOutput(`${id}-apiManagementCustomDomainId`, scope, apiManagementCustomDomain.id)

    return apiManagementCustomDomain
  }
}
