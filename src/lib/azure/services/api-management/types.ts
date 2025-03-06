import { ApiManagementConfig } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementBackendConfig } from '@cdktf/provider-azurerm/lib/api-management-backend'
import { ApiManagementApiConfig } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementApiOperationConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation'
import { ApiManagementApiOperationPolicyConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation-policy'

export interface ApiManagementProps extends ApiManagementConfig {}

export interface ApiManagementBackendProps extends ApiManagementBackendConfig {
  backendUrlPath?: string
}

export interface ApiManagementApiProps extends ApiManagementApiConfig {
  operations: ApiManagementApiOperationConfig[]
  policyXmlContent?: ApiManagementApiOperationPolicyConfig['xmlContent']
}

export interface ApiManagementV2Props extends ApiManagementConfig {
  body: any
}
