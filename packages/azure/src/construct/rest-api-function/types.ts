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

export interface ApiManagementRestApiProps extends ApiManagementProps {
  useExistingApiManagement: boolean
}

export interface ApiManagementCors {
  enableCors: boolean
  allowCredentials: boolean
  allowedMethods: string[]
  allowedHeaders: string[]
  allowedOrigins?: string[]
  originSubdomain?: string
}

export interface AzureRestApiFunctionProps extends AzureRestApiProps, AzureFunctionAppProps {
  apiManagementBackend: ApiManagementBackendProps
  apiManagementApi: ApiManagementApiProps
  apiManagementApplicationInsights?: ApplicationInsightsProps
  apiManagement: ApiManagementRestApiProps
  apiManagementCors?: ApiManagementCors
}

export interface AzureApiFunction extends AzureApi {
  corsPolicyXmlContent?: string
  apiOperations: { [operation: string]: ApiOperation }
  managementApi: Api
  backend: Backend
  namedValue: NamedValue
}
