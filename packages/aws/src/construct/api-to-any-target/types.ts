import {
  BasePathMapping,
  DomainName,
  IAuthorizer,
  IResource,
  IRestApi,
  Integration,
  Method,
  MethodResponse,
  MockIntegration,
  Resource,
} from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'

import { CommonStackProps } from '../../common/index.js'
import { AcmProps, RestApigProps } from '../../services/index.js'

/**
 * Type definition for REST API resources used by the {@link ApiToAnyTarget} construct
 */
/** @category Interface */
export interface ApiToAnyTargetRestApiType {
  /** The CloudWatch log group for API Gateway access logs */
  accessLogGroup: LogGroup
  /** The API Gateway REST API */
  api: IRestApi
  /** The optional API Gateway authorizer */
  authoriser?: IAuthorizer
  /** The base path mappings for the API custom domain */
  basePathMappings: BasePathMapping[]
  /** The SSL/TLS certificate for the custom domain */
  certificate: ICertificate
  /** The API Gateway custom domain */
  domain: DomainName
  /** The Route53 hosted zone for the API domain */
  hostedZone: IHostedZone
  /** The default API Gateway integration */
  integration: Integration
  /** Map of HTTP methods to their API Gateway Method resources */
  method: { [httpMethod: string]: Method }
  /** The default method error response */
  methodErrorResponse: MethodResponse
  /** The default method success response */
  methodResponse: MethodResponse
  /** Map of paths to their API Gateway Resource objects */
  resource: { [path: string]: Resource }
}

/**
 * Properties for defining an individual API resource with its integration and configuration
 */
/** @category Interface */
export interface ApiToAnyTargetRestApiResource {
  /** Whether to add a proxy resource ({proxy+}) under this resource */
  addProxy: boolean
  /** The optional API Gateway authorizer for this resource */
  authorizer?: IAuthorizer
  /** The allowed CORS origins */
  allowedOrigins?: string[]
  /** The allowed CORS HTTP methods */
  allowedMethods?: string[]
  /** The allowed CORS headers */
  allowedHeaders?: string[]
  /** The API Gateway integration for this resource */
  integration: Integration
  /** Required method request parameters */
  methodRequestParameters?: { [param: string]: boolean }
  /** The resource path segment */
  path: string
  /** The parent resource to attach this resource to */
  parent?: IResource
  /** The integration to use for the proxy resource */
  proxyIntegration?: Integration
  /** Whether to enable default CORS preflight configuration */
  enableDefaultCors?: boolean
  /** The mock integration for testing */
  mockIntegration?: MockIntegration
  /** The mock method responses */
  mockMethodResponses?: MethodResponse[]
}

/**
 * Properties for configuring the REST API in the {@link ApiToAnyTarget} construct
 */
/** @category Interface */
export interface ApiToAnyTargetRestApiProps {
  /** The SSL/TLS certificate configuration */
  certificate: AcmProps
  /** CloudFormation export name for an existing REST API ID */
  importedRestApiRef?: string
  /** CloudFormation export name for an existing REST API root resource ID */
  importedRestApiRootResourceRef?: string
  /** Custom method error response configuration */
  methodErrorResponse: MethodResponse
  /** Custom method success response configuration */
  methodResponse: MethodResponse
  /** REST API configuration properties */
  restApi: RestApigProps
  /** Whether to use an existing REST API instead of creating a new one */
  useExisting: boolean
  /** Whether to create resources and methods on the REST API */
  withResource?: boolean
}

/**
 * Properties for configuring an {@link ApiToAnyTarget} construct
 */
/** @category Interface */
export interface ApiToAnyTargetProps extends CommonStackProps {
  /** REST API configuration */
  api: ApiToAnyTargetRestApiProps
  /** Additional API root paths for base path mappings */
  apiRootPaths?: string[]
  /** The subdomain for the API Gateway custom domain */
  apiSubDomain: string
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** The timezone for the application */
  timezone: string
  /** Whether to look up an existing hosted zone instead of creating one */
  useExistingHostedZone: boolean
}
