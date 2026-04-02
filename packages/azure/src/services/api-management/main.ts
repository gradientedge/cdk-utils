import {
  Api,
  ApiDiagnostic,
  ApiManagementService,
  ApiOperation,
  ApiOperationPolicy,
  ApiPolicy,
  Backend,
  BackendProtocol,
  Cache,
  getApiManagementServiceOutput,
  Logger,
  LoggerType,
  NamedValue,
  Protocol,
  Subscription,
} from '@pulumi/azure-native/apimanagement/index.js'
import * as redis from '@pulumi/azure-native/redis/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import {
  ApiDiagnosticProps,
  ApiManagementApiProps,
  ApiManagementBackendProps,
  ApiManagementProps,
  ApiOperationPolicyProps,
  ApiOperationProps,
  ApiPolicyProps,
  ApiSubscriptionProps,
  CacheProps,
  LoggerProps,
  NamedValueProps,
  ResolveApiManagementProps,
} from './types.js'

/**
 * Provides operations on Azure API Management using Pulumi
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
 * @category Service
 */
export class AzureApiManagementManager {
  /**
   * @summary Method to create a new API Management service
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management properties
   * @param applicationInsightsKey Optional Application Insights instrumentation key for logging
   * @param externalRedisCache Optional external Redis cache for API Management caching
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apimanagementservice/}
   */
  public createApiManagementService(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementProps,
    applicationInsightsKey?: string,
    externalRedisCache?: redis.Redis,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
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
        { parent: scope, dependsOn: [apiManagementService] }
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
        { parent: scope, dependsOn: apiManagementService }
      )
    }

    return apiManagementService
  }

  /**
   * @summary Method to resolve an existing API Management service
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management lookup properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Lookup]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apimanagementservice/}
   */
  public resolveApiManagementService(
    id: string,
    scope: CommonAzureConstruct,
    props: ResolveApiManagementProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new API Management backend
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management backend properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Backend]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/backend/}
   */
  public createBackend(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementBackendProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new API Management API with operations and policies
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Management API properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management API]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/api/}
   */
  public createApi(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiManagementApiProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )

    return api
  }

  /**
   * @summary Method to create a new API Diagnostic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Disagnostic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Diagnostic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apidiagnostic/}
   */
  public createApiDiagnostic(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiDiagnosticProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new ApiDiagnostic(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API Logger
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Logger properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Logger]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/logger/}
   */
  public createLogger(id: string, scope: CommonAzureConstruct, props: LoggerProps, resourceOptions?: ResourceOptions) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new Logger(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API Named Value
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Named Value properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Named Value]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/namedvalue/}
   */
  public createNamedValue(
    id: string,
    scope: CommonAzureConstruct,
    props: NamedValueProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new NamedValue(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API Subscription
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API Subscription properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/subscription/}
   */
  public createSubscription(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiSubscriptionProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new Subscription(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API cache
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API cache properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Cache]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/cache/}
   */
  public createCache(id: string, scope: CommonAzureConstruct, props: CacheProps, resourceOptions?: ResourceOptions) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new Cache(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API operation
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API operation properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Operation]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apioperation/}
   */
  public createOperation(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiOperationProps,
    resourceOptions?: ResourceOptions
  ) {
    return new ApiOperation(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API operation policy
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API operation policy properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Operation Policy]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apioperationpolicy/}
   */
  public createOperationPolicy(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiOperationPolicyProps,
    resourceOptions?: ResourceOptions
  ) {
    return new ApiOperationPolicy(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API policy
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props API policy properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native API Management Policy]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apipolicy/}
   */
  public createPolicy(
    id: string,
    scope: CommonAzureConstruct,
    props: ApiPolicyProps,
    resourceOptions?: ResourceOptions
  ) {
    return new ApiPolicy(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new API Management custom domain
   * In Pulumi Azure Native, custom domains are configured as part of the API Management service resource,
   * not as a separate resource. Use the hostnameConfigurations property when creating the service.
   */
  public createApiManagementCustomDomain() {
    // Note: In Pulumi Azure Native, custom domains are part of the ApiManagementService
    // This method is provided for API compatibility but should be configured
    // via the hostnameConfigurations property of ApiManagementService instead
    throw new Error(
      'Custom domains should be configured via the hostnameConfigurations property of ApiManagementService in Pulumi Azure Native'
    )
  }
}
