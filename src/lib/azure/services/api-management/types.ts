import { ApiManagementConfig } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementBackendConfig } from '@cdktf/provider-azurerm/lib/api-management-backend'
import { ApiManagementApiConfig } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementApiOperationConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation'
import { ApiManagementApiOperationPolicyConfig } from '@cdktf/provider-azurerm/lib/api-management-api-operation-policy'

export interface ApiManagementProps extends ApiManagementConfig {}

export interface ApiManagementBackendProps extends ApiManagementBackendConfig {}

export interface ApiManagementApiProps extends ApiManagementApiConfig {
  operations: OperationsProps[]
  policyXmlContent?: ApiManagementApiOperationPolicyConfig['xmlContent']
}

export interface OperationsProps {
  path: ApiManagementApiOperationConfig['urlTemplate']
  method: ApiManagementApiOperationConfig['method']
}
