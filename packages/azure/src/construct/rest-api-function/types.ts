import { Api, ApiOperation, Backend, NamedValue } from '@pulumi/azure-native/apimanagement/index.js'

import {
  ApiManagementApiProps,
  ApiManagementBackendProps,
  ApiManagementProps,
  ApplicationInsightsProps,
  AzureApi,
  AzureFunctionAppProps,
  AzureRestApiProps,
} from '../../index.js'

/** @category Interface */
export interface ApiManagementRestApiProps extends ApiManagementProps {
  useExistingApiManagement: boolean
}

/** @category Interface */
export interface ApiManagementCors {
  enableCors: boolean
  allowCredentials: boolean
  allowedMethods: string[]
  allowedHeaders: string[]
  allowedOrigins?: string[]
  originSubdomain?: string
}

/** @category Interface */
export interface AzureRestApiFunctionProps extends AzureRestApiProps, AzureFunctionAppProps {
  apiManagementBackend: ApiManagementBackendProps
  apiManagementApi: ApiManagementApiProps
  apiManagementApplicationInsights?: ApplicationInsightsProps
  apiManagement: ApiManagementRestApiProps
  apiManagementCors?: ApiManagementCors
}

/** @category Interface */
export interface AzureApiFunction extends AzureApi {
  apiOperations: { [operation: string]: ApiOperation }
  backend: Backend
  corsPolicyXmlContent?: string
  managementApi: Api
  namedValue: NamedValue
  validateJwtPolicyXmlContent?: string
}
