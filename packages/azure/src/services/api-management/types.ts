import {
  ApiArgs,
  ApiDiagnosticArgs,
  ApiManagementServiceArgs,
  ApiOperationArgs,
  ApiOperationPolicyArgs,
  ApiPolicyArgs,
  BackendArgs,
  CacheArgs,
  GetApiManagementServiceOutputArgs,
  LoggerArgs,
  NamedValueArgs,
  SubscriptionArgs,
} from '@pulumi/azure-native/apimanagement/index.js'
import { Input } from '@pulumi/pulumi'

/**
 * Properties for creating an Azure API Management service
 * @see [Pulumi Azure Native API Management]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apimanagementservice/}
 * @category Interface
 */
export interface ApiManagementProps extends ApiManagementServiceArgs {
  /** Key Vault resource ID containing the SSL certificate for custom domains */
  certificateKeyVaultId?: Input<string>
  /** Pulumi stack name for importing an existing API Management service */
  apiStackName?: string
  /** When true, resolves an existing API Management service instead of creating one */
  useExistingApiManagement?: boolean
}

/**
 * Properties for creating an API Management backend
 * @see [Pulumi Azure Native API Management Backend]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/backend/}
 * @category Interface
 */
export interface ApiManagementBackendProps extends BackendArgs {
  /** URL path appended to the backend base URL */
  backendUrlPath?: string
  /** API Management service resource ID */
  apiManagementId?: string
  /** Circuit breaker configuration for backend fault tolerance */
  circuitBreaker?: any
}

/**
 * Properties for creating an API diagnostic
 * @see [Pulumi Azure Native API Management Diagnostic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/apidiagnostic/}
 * @category Interface
 */
export interface ApiDiagnosticProps extends ApiDiagnosticArgs {}

/**
 * Properties for creating an API Management logger
 * @see [Pulumi Azure Native API Management Logger]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/logger/}
 * @category Interface
 */
export interface LoggerProps extends LoggerArgs {}

/**
 * Properties for creating an API Management named value
 * @see [Pulumi Azure Native API Management Named Value]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/namedvalue/}
 * @category Interface
 */
export interface NamedValueProps extends NamedValueArgs {}

/**
 * Properties for creating an API Management subscription
 * @see [Pulumi Azure Native API Management Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/subscription/}
 * @category Interface
 */
export interface ApiSubscriptionProps extends SubscriptionArgs {}

/**
 * Properties for creating an API Management cache
 * @see [Pulumi Azure Native API Management Cache]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/cache/}
 * @category Interface
 */
export interface CacheProps extends CacheArgs {}

/**
 * Properties for configuring custom domains on an API Management service
 * @category Interface
 */
export interface ApiManagementCustomDomainProps {
  /** The API Management service resource ID */
  apiManagementId: string
  /** Gateway (proxy) custom domain configurations */
  gateway?: Array<{
    /** Custom hostname for the gateway */
    hostName: string
    /** Key Vault certificate resource ID */
    certificateId?: string
    /** Enable client certificate negotiation */
    negotiateClientCertificate?: boolean
  }>
  /** Developer portal custom domain configurations */
  developerPortal?: Array<{
    /** Custom hostname for the developer portal */
    hostName: string
    /** Key Vault certificate resource ID */
    certificateId?: string
  }>
  /** Management endpoint custom domain configurations */
  management?: Array<{
    /** Custom hostname for the management endpoint */
    hostName: string
    /** Key Vault certificate resource ID */
    certificateId?: string
  }>
}

/**
 * Properties for creating an API Management API with operations
 * @see [Pulumi Azure Native API Management API]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/apimanagement/api/}
 * @category Interface
 */
export interface ApiManagementApiProps extends ApiArgs {
  /** List of API operations to create */
  operations: ApiManagementApiOperationProps[]
  /** Common inbound policy XML to apply to all operations */
  commonInboundPolicyXml?: string
  /** Common outbound policy XML to apply to all operations */
  commonOutboundPolicyXml?: string
  /** Inbound cache-set policy XML */
  cacheSetInboundPolicy?: string
  /** Outbound cache-set policy XML */
  cacheSetOutboundPolicy?: string
  /** Rate limiting configuration for the API */
  rateLimit?: ApiManagementApiRateLimit
}

/**
 * Properties for creating an API Management API operation with optional caching
 * @category Interface
 */
export interface ApiManagementApiOperationProps extends ApiOperationArgs {
  /** Caching configuration for this operation */
  caching?: ApiManagementApiCaching
}

/**
 * Caching configuration for an API Management API operation
 * @category Interface
 */
export interface ApiManagementApiCaching {
  /** Enable cache-set policy for this operation */
  enableCacheSet?: boolean
  /** Enable cache invalidation for this operation */
  enableCacheInvalidation?: boolean
  /** Cache time-to-live in seconds */
  ttlInSecs?: number
  /** Type of caching strategy to use */
  cachingType?: string
}

/**
 * Rate limiting configuration for an API Management API
 * @category Interface
 */
export interface ApiManagementApiRateLimit {
  /** Maximum number of calls allowed within the renewal period */
  calls: number
  /** Rate limit renewal period in seconds */
  renewalPeriodInSecs: number
}

/**
 * Properties for configuring an external Redis cache on an API Management service
 * @category Interface
 */
export interface ApiManagementRedisCacheProps {
  /** The API Management service resource ID */
  apiManagementId: string
  /** Redis connection string */
  connectionString: string
  /** Azure region of the Redis cache */
  cacheLocation: string
  /** Redis cache resource ID */
  redisCacheId: string
}

/**
 * Properties for resolving an existing API Management service
 * @category Interface
 */
export interface ResolveApiManagementProps extends GetApiManagementServiceOutputArgs {}

/**
 * Properties for creating an API Management API operation
 * @category Interface
 */
export interface ApiOperationProps extends ApiOperationArgs {}

/**
 * Properties for creating an API Management API operation policy
 * @category Interface
 */
export interface ApiOperationPolicyProps extends ApiOperationPolicyArgs {}

/**
 * Properties for creating an API Management API policy
 * @category Interface
 */
export interface ApiPolicyProps extends ApiPolicyArgs {}
