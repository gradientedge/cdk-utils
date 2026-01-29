import {
  Api,
  ApiManagementService,
  ApiOperation,
  ApiOperationPolicy,
  Backend,
  BackendProtocol,
  Cache,
  getApiManagementServiceOutput,
  Logger,
  LoggerType,
  PolicyContentFormat,
  Protocol,
} from '@pulumi/azure-native/apimanagement/index.js'
import * as redis from '@pulumi/azure-native/redis/index.js'
import _ from 'lodash'
import { CommonAzureConstruct } from '../../common/index.js'
import {
  ApiManagementApiProps,
  ApiManagementBackendProps,
  ApiManagementCustomDomainProps,
  ApiManagementProps,
  ResolveApiManagementProps,
} from './types.js'

/**
 * @classdesc Provides operations on Azure API Management using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.apiManagementManager.createApiManagement('MyApiManagement', this, props)
 *   }
 * }
 * ```
 */
export class AzureApiManagementManager {
  /**
   * @summary Method to create a new API Management service
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management properties
   * @param applicationInsightsKey Optional Application Insights instrumentation key for logging
   * @param externalRedisCache Optional external Redis cache for API Management caching
   * @see [Pulumi Azure Native API Management]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apimanagementservice/}
   */
  public createApiManagementService(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementProps,
    applicationInsightsKey?: string,
    externalRedisCache?: redis.Redis
  ) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    const apiManagementService = new ApiManagementService(
      `${id}-am`,
      {
        ...props,
        serviceName: scope.resourceNameFormatter.format(
          props.serviceName?.toString(),
          scope.props.resourceNameOptions?.apiManagement
        ),
        resourceGroupName: resourceGroupName,
        location: props.location ?? scope.props.location,
        publisherEmail: props.publisherEmail ?? 'noreply@example.com',
        publisherName: props.publisherName ?? 'Default Publisher',
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope }
    )

    // Create logger if Application Insights key is provided
    if (applicationInsightsKey) {
      new Logger(
        `${id}-am-logger`,
        {
          loggerId: scope.resourceNameFormatter.format(
            props.serviceName?.toString(),
            scope.props.resourceNameOptions?.apiManagementLogger
          ),
          resourceGroupName: resourceGroupName,
          serviceName: apiManagementService.name,
          loggerType: LoggerType.ApplicationInsights,
          credentials: {
            instrumentationKey: applicationInsightsKey,
          },
        },
        { parent: scope }
      )
    }

    // Create Redis cache connection if external Redis is provided
    if (externalRedisCache) {
      new Cache(
        `${id}-am-redis-cache`,
        {
          cacheId: scope.resourceNameFormatter.format(
            props.serviceName?.toString(),
            scope.props.resourceNameOptions?.apiManagementRedisCache
          ),
          serviceName: apiManagementService.name,
          resourceGroupName: resourceGroupName,
          connectionString: externalRedisCache.hostName.apply(
            hostName =>
              `${hostName}:10000,password=${externalRedisCache.accessKeys.apply(k => k?.primaryKey)},ssl=True,abortConnect=False`
          ),
          useFromLocation: externalRedisCache.location,
          resourceId: externalRedisCache.id,
        },
        { parent: scope }
      )
    }

    return apiManagementService
  }

  /**
   * @summary Method to resolve an existing API Management service
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management lookup properties
   * @see [Pulumi Azure Native API Management Lookup]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apimanagementservice/}
   */
  public resolveApiManagementService(id: string, scope: CommonAzureConstruct, props: ResolveApiManagementProps) {
    if (!props) throw `Props undefined for ${id}`

    return getApiManagementServiceOutput(
      {
        serviceName: scope.resourceNameFormatter.format(
          props.serviceName?.toString(),
          scope.props.resourceNameOptions?.dataAzurermApiManagement
        ),
        resourceGroupName: scope.props.resourceGroupName
          ? `${scope.props.resourceGroupName}-${scope.props.stage}`
          : props.resourceGroupName,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new API Management backend
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management backend properties
   * @see [Pulumi Azure Native API Management Backend]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/backend/}
   */
  public createBackend(id: string, scope: CommonAzureConstruct, props: ApiManagementBackendProps) {
    if (!props) throw `Props undefined for ${id}`

    return new Backend(
      `${id}-am-be`,
      {
        ...props,
        backendId: scope.resourceNameFormatter.format(
          props.backendId?.toString(),
          scope.props.resourceNameOptions?.apiManagementBackend
        ),
        description: props.description ?? `Backend for ${(props as any).name || id}-${scope.props.stage}`,
        protocol: props.protocol ?? BackendProtocol.Http,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new API Management API with operations and policies
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management API properties
   * @see [Pulumi Azure Native API Management API]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/api/}
   */
  public createApi(id: string, scope: CommonAzureConstruct, props: ApiManagementApiProps) {
    if (!props) throw `Props undefined for ${id}`

    const api = new Api(
      `${id}-am-api`,
      {
        ...props,
        apiId: scope.resourceNameFormatter.format(
          props.apiId?.toString(),
          scope.props.resourceNameOptions?.apiManagementApi
        ),
        displayName: props.displayName ?? props.apiId,
        apiRevision: props.apiRevision ?? '1',
        protocols: props.protocols ?? [Protocol.Https],
      },
      { parent: scope }
    )

    // Create operations and policies
    _.forEach(props.operations, operation => {
      const operationId = `${operation.displayName}-${operation.method}`
      const apimOperation = new ApiOperation(
        `${id}-apim-api-operation-${operation.displayName}-${operation.method}`,
        {
          operationId: operationId,
          method: (operation.method as string)?.toUpperCase() || 'GET',
          serviceName: props.serviceName!,
          resourceGroupName: props.resourceGroupName!,
          apiId: api.name,
          displayName: operation.displayName,
          urlTemplate: operation.urlTemplate,
          templateParameters: operation.templateParameters,
        },
        { parent: scope }
      )

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
                      <cache-lookup-value key="@((string)context.Variables["customCacheKey"])" variable-name="cachedResponse" caching-type="${operation.caching.cachingType || 'prefer-external'}" />

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
                      <cache-remove-value key="@((string)context.Variables["customCacheKey"])" caching-type="${operation.caching.cachingType || 'prefer-external'}" />
                  </when>
              </choose>`
          cacheSetOutboundPolicy = `<!-- Store the response body in cache -->
              <choose>
                  <when condition="@(context.Response.StatusCode == 200)">
                      <cache-store-value key="@((string)context.Variables["customCacheKey"])" value="@(context.Response.Body.As<string>(preserveContent: true))" duration="${operation.caching.ttlInSecs ?? 900}" caching-type="${operation.caching.cachingType || 'prefer-external'}" />
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
                      <cache-remove-value key="@((string)context.Variables["customCacheKey"])" caching-type="${operation.caching.cachingType || 'prefer-external'}" />
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
        rateLimitPolicy = `<rate-limit-by-key calls="${props.rateLimit.calls}" renewal-period="${props.rateLimit.renewalPeriodInSecs}" counter-key="${scope.props.subscriptionId}-${operationId}"/>`
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

      new ApiOperationPolicy(
        `${id}-apim-api-operation-policy-${operation.displayName}-${operation.method}`,
        {
          serviceName: props.serviceName!,
          resourceGroupName: props.resourceGroupName!,
          apiId: api.name,
          operationId: operationId,
          policyId: 'policy',
          value: policyXmlContent,
          format: PolicyContentFormat.Xml,
        },
        { parent: scope }
      )
    })

    return api
  }

  /**
   * @summary Method to create a new API Management custom domain
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management custom domain properties
   * @note In Pulumi Azure Native, custom domains are configured as part of the API Management service resource,
   * not as a separate resource. Use the hostnameConfigurations property when creating the service.
   */
  public createApiManagementCustomDomain(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementCustomDomainProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    // Note: In Pulumi Azure Native, custom domains are part of the ApiManagementService
    // This method is provided for API compatibility but should be configured
    // via the hostnameConfigurations property of ApiManagementService instead
    throw new Error(
      'Custom domains should be configured via the hostnameConfigurations property of ApiManagementService in Pulumi Azure Native'
    )
  }
}
