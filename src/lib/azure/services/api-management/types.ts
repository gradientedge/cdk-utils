import { ApiManagementConfig } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementBackendConfig } from '@cdktf/provider-azurerm/lib/api-management-backend'
import { ApiManagementApiConfig } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementApiOperationConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation'
import { ApiManagementApiOperationPolicyConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation-policy'

export interface ApiManagementProps extends Omit<ApiManagementConfig, 'name'> {
  name?: string | undefined
}

export interface ApiManagementBackendProps extends ApiManagementBackendConfig {}

export interface ApiManagementApiProps extends ApiManagementApiConfig {
  operations: ApiManagementApiOperationConfig[]
  policyXmlContent?: ApiManagementApiOperationPolicyConfig['xmlContent']
}
