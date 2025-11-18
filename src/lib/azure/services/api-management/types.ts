import { ApiManagementConfig } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementBackendConfig } from '@cdktf/provider-azurerm/lib/api-management-backend'
import { ApiManagementCustomDomainConfig } from '@cdktf/provider-azurerm/lib/api-management-custom-domain'
import { ApiManagementApiConfig } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementApiOperationConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation'
import { ApiManagementRedisCacheConfig } from '@cdktf/provider-azurerm/lib/api-management-redis-cache'

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
}

export interface ApiManagementApiRateLimit {
  calls: number
  renewalPeriodInSecs: number
}

export interface ApiManagementRedisCacheProps extends ApiManagementRedisCacheConfig {}
