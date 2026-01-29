import {
  ApiArgs,
  ApiManagementServiceArgs,
  ApiOperationArgs,
  BackendArgs,
  GetApiManagementServiceOutputArgs,
} from '@pulumi/azure-native/apimanagement/index.js'

export interface ApiManagementProps extends ApiManagementServiceArgs {}

export interface ApiManagementBackendProps extends BackendArgs {
  backendUrlPath?: string
  apiManagementId?: string
  circuitBreaker?: any
}

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
