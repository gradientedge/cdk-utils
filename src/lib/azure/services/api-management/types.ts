import { ApiManagementConfig } from '@cdktf/provider-azurerm/lib/api-management/index.js'
import { ApiManagementBackendConfig } from '@cdktf/provider-azurerm/lib/api-management-backend/index.js'
import { ApiManagementCustomDomainConfig } from '@cdktf/provider-azurerm/lib/api-management-custom-domain/index.js'
import { ApiManagementApiConfig } from '@cdktf/provider-azurerm/lib/api-management-api/index.js'
import { ApiManagementApiOperationConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation/index.js'
import { ApiManagementRedisCacheConfig } from '@cdktf/provider-azurerm/lib/api-management-redis-cache/index.js'

export interface ApiManagementProps extends ApiManagementConfig {}

export interface ApiManagementBackendProps extends ApiManagementBackendConfig {
  backendUrlPath?: string
  apiManagementId: string
  circuitBreaker: any
}

export interface ApiManagementCustomDomainProps extends ApiManagementCustomDomainConfig {}

export interface ApiManagementApiProps extends ApiManagementApiConfig {
  operations: ApiManagementApiOperationProps[]
  commonInboundPolicyXml: string
  commonOutboundPolicyXml: string
  rateLimit?: ApiManagementApiRateLimit
}

export interface ApiManagementApiOperationProps extends ApiManagementApiOperationConfig {
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

export interface ApiManagementRedisCacheProps extends ApiManagementRedisCacheConfig {}
