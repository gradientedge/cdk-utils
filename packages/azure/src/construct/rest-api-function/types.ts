import { Api, ApiOperation, Backend, NamedValue } from '@pulumi/azure-native/apimanagement/index.js'
import { Input } from '@pulumi/pulumi'

import {
  ApiManagementApiProps,
  ApiManagementBackendProps,
  ApiManagementProps,
  ApplicationInsightsProps,
  AzureApi,
  AzureFunctionAppProps,
  AzureRestApiProps,
} from '../../index.js'

/**
 * Extended API Management properties with existing service resolution support
 * @category Interface
 */
export interface ApiManagementRestApiProps extends ApiManagementProps {
  /** When true, resolves an existing API Management service instead of creating a new one */
  useExistingApiManagement: boolean
}

/**
 * CORS policy configuration for API Management
 * @category Interface
 */
export interface ApiManagementCors {
  /** Enable CORS policy on the API Management service */
  enableCors: boolean
  /** Allow credentials in cross-origin requests */
  allowCredentials: boolean
  /** List of allowed HTTP methods */
  allowedMethods: string[]
  /** List of allowed HTTP headers */
  allowedHeaders: string[]
  /** Explicit list of allowed origins; takes precedence over originSubdomain */
  allowedOrigins?: string[]
  /** Subdomain used to auto-generate per-locale allowed origins */
  originSubdomain?: string
}

/**
 * Properties for the {@link AzureRestApiFunction} construct
 * @category Interface
 */
export interface AzureRestApiFunctionProps extends AzureRestApiProps, AzureFunctionAppProps {
  /** Backend configuration for routing to the function app */
  apiManagementBackend: ApiManagementBackendProps
  /** API configuration including operations and policies */
  apiManagementApi: ApiManagementApiProps
  /** Optional Application Insights properties for API-level monitoring */
  apiManagementApplicationInsights?: ApplicationInsightsProps
  /** API Management service properties with existing service resolution */
  apiManagement: ApiManagementRestApiProps
  /** Optional CORS policy configuration */
  apiManagementCors?: ApiManagementCors
}

/**
 * Provisioned API Management resources for the function-backed REST API
 * @category Interface
 */
export interface AzureApiFunction extends AzureApi {
  /** Map of operation display names to provisioned API operation resources */
  apiOperations: { [operation: string]: ApiOperation }
  /** The provisioned API Management backend pointing to the function app */
  backend: Backend
  /** Generated CORS policy XML content */
  corsPolicyXmlContent?: string
  /** The provisioned API Management API resource */
  managementApi: Api
  /** Named value resource for the function app host key */
  namedValue: NamedValue
  /** Generated JWT validation policy XML content */
  validateJwtPolicyXmlContent?: Input<string>
}
