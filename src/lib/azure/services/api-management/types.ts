import { ApiManagementConfig } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementBackendConfig } from '@cdktf/provider-azurerm/lib/api-management-backend'
import { ApiManagementCustomDomainConfig } from '@cdktf/provider-azurerm/lib/api-management-custom-domain'
import { ApiManagementApiConfig } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementApiOperationConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation'

export interface ApiManagementProps extends ApiManagementConfig {}

export interface ApiManagementBackendProps extends ApiManagementBackendConfig {
  backendUrlPath?: string
}

export interface ApiManagementCustomDomainProps extends ApiManagementCustomDomainConfig {}

export interface ApiManagementApiProps extends ApiManagementApiConfig {
  operations: ApiManagementApiOperationProps[]
  commonInboundPolicyXml: string
  commonOutboundPolicyXml: string
}

export interface ApiManagementV2Props extends ApiManagementConfig {
  body: any
}

export interface ApiManagementApiOperationProps extends ApiManagementApiOperationConfig {
  cacheInboundPolicy: string
  cacheOutboundPolicy: string
}
