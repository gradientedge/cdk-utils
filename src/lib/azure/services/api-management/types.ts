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

export interface ApiManagementProps extends ApiManagementServiceArgs {
  certificateKeyVaultId?: string
  apiStackName?: string
  useExistingApiManagement?: boolean
}

export interface ApiManagementBackendProps extends BackendArgs {
  backendUrlPath?: string
  apiManagementId?: string
  circuitBreaker?: any
}

export interface ApiDiagnosticProps extends ApiDiagnosticArgs {}

export interface LoggerProps extends LoggerArgs {}

export interface NamedValueProps extends NamedValueArgs {}

export interface ApiSubscriptionProps extends SubscriptionArgs {}

export interface CacheProps extends CacheArgs {}

export interface ApiManagementCustomDomainProps {
  apiManagementId: string
  gateway?: Array<{
    hostName: string
    certificateId?: string
    negotiateClientCertificate?: boolean
  }>
  developerPortal?: Array<{
    hostName: string
    certificateId?: string
  }>
  management?: Array<{
    hostName: string
    certificateId?: string
  }>
}

export interface ApiManagementApiProps extends ApiArgs {
  operations: ApiManagementApiOperationProps[]
  commonInboundPolicyXml?: string
  commonOutboundPolicyXml?: string
  cacheSetInboundPolicy?: string
  cacheSetOutboundPolicy?: string
  rateLimit?: ApiManagementApiRateLimit
}

export interface ApiManagementApiOperationProps extends ApiOperationArgs {
  caching?: ApiManagementApiCaching
}

export interface ApiManagementApiCaching {
  enableCacheSet?: boolean
  enableCacheInvalidation?: boolean
  ttlInSecs?: number
  cachingType?: string
}

export interface ApiManagementApiRateLimit {
  calls: number
  renewalPeriodInSecs: number
}

export interface ApiManagementRedisCacheProps {
  apiManagementId: string
  connectionString: string
  cacheLocation: string
  redisCacheId: string
}

export interface ResolveApiManagementProps extends GetApiManagementServiceOutputArgs {}

export interface ApiOperationProps extends ApiOperationArgs {}

export interface ApiOperationPolicyProps extends ApiOperationPolicyArgs {}

export interface ApiPolicyProps extends ApiPolicyArgs {}
