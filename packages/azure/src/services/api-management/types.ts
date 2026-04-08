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

/** @category Interface */
export interface ApiManagementProps extends ApiManagementServiceArgs {
  certificateKeyVaultId?: Input<string>
  apiStackName?: string
  useExistingApiManagement?: boolean
}

/** @category Interface */
export interface ApiManagementBackendProps extends BackendArgs {
  backendUrlPath?: string
  apiManagementId?: string
  circuitBreaker?: any
}

/** @category Interface */
export interface ApiDiagnosticProps extends ApiDiagnosticArgs {}

/** @category Interface */
export interface LoggerProps extends LoggerArgs {}

/** @category Interface */
export interface NamedValueProps extends NamedValueArgs {}

/** @category Interface */
export interface ApiSubscriptionProps extends SubscriptionArgs {}

/** @category Interface */
export interface CacheProps extends CacheArgs {}

/** @category Interface */
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

/** @category Interface */
export interface ApiManagementApiProps extends ApiArgs {
  operations: ApiManagementApiOperationProps[]
  commonInboundPolicyXml?: string
  commonOutboundPolicyXml?: string
  cacheSetInboundPolicy?: string
  cacheSetOutboundPolicy?: string
  rateLimit?: ApiManagementApiRateLimit
}

/** @category Interface */
export interface ApiManagementApiOperationProps extends ApiOperationArgs {
  caching?: ApiManagementApiCaching
}

/** @category Interface */
export interface ApiManagementApiCaching {
  enableCacheSet?: boolean
  enableCacheInvalidation?: boolean
  ttlInSecs?: number
  cachingType?: string
}

/** @category Interface */
export interface ApiManagementApiRateLimit {
  calls: number
  renewalPeriodInSecs: number
}

/** @category Interface */
export interface ApiManagementRedisCacheProps {
  apiManagementId: string
  connectionString: string
  cacheLocation: string
  redisCacheId: string
}

/** @category Interface */
export interface ResolveApiManagementProps extends GetApiManagementServiceOutputArgs {}

/** @category Interface */
export interface ApiOperationProps extends ApiOperationArgs {}

/** @category Interface */
export interface ApiOperationPolicyProps extends ApiOperationPolicyArgs {}

/** @category Interface */
export interface ApiPolicyProps extends ApiPolicyArgs {}
