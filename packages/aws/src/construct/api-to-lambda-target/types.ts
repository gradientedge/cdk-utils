import {
  BasePathMapping,
  DomainName,
  IAuthorizer,
  Integration,
  IntegrationResponse,
  IRestApi,
  Method,
  MethodResponse,
  Model,
  Resource,
} from 'aws-cdk-lib/aws-apigateway'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { ITopic } from 'aws-cdk-lib/aws-sns'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'

import { AcmProps, LambdaRestApiProps } from '../../services/index.js'
import { CommonStackProps } from '../../common/index.js'

/**
 * Type definition for REST API resources used by the {@link ApiToLambdaTarget} construct
 */
/** @category Interface */
export interface ApiToLambdaTargetRestApiType {
  /** The API Gateway REST API */
  api: IRestApi
  /** The optional API Gateway authorizer */
  authoriser?: IAuthorizer
  /** The base path mappings for the API custom domain */
  basePathMappings: BasePathMapping[]
  /** The SSL/TLS certificate for the custom domain */
  certificate: acm.ICertificate
  /** The API Gateway custom domain */
  domain: DomainName
  /** The API Gateway error response model */
  errorResponseModel: Model
  /** The Route53 hosted zone for the API domain */
  hostedZone: route53.IHostedZone
  /** The API Gateway Lambda integration */
  integration: Integration
  /** The integration error response mapping */
  integrationErrorResponse: IntegrationResponse
  /** The integration request parameter mappings */
  integrationRequestParameters: { [p: string]: string }
  /** The integration request template mappings */
  integrationRequestTemplates: { [p: string]: string }
  /** The integration success response mapping */
  integrationResponse: IntegrationResponse
  /** The Lambda function used as the integration target */
  lambda: IFunction
  /** The API Gateway resource method */
  method: Method
  /** The method error response */
  methodErrorResponse: MethodResponse
  /** The method success response */
  methodResponse: MethodResponse
  /** The IAM policy for the API Gateway integration role */
  policy?: PolicyDocument
  /** The API Gateway resource */
  resource: Resource
  /** The success response model */
  responseModel: Model
  /** The IAM role for the API Gateway integration */
  role?: Role
  /** The optional SNS topic */
  topic?: ITopic
}

/**
 * Properties for configuring the REST API in the {@link ApiToLambdaTarget} construct
 */
/** @category Interface */
export interface ApiToLambdaTargetRestApiProps {
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
  /** The API resource path name */
  resource: string
  /** REST API configuration properties */
  restApi: LambdaRestApiProps
  /** Whether to use an existing REST API instead of creating a new one */
  useExisting: boolean
  /** Whether to create a resource and method on the REST API */
  withResource?: boolean
}

/**
 * Properties for configuring an {@link ApiToLambdaTarget} construct
 */
/** @category Interface */
export interface ApiToLambdaTargetProps extends CommonStackProps {
  /** REST API configuration */
  api: ApiToLambdaTargetRestApiProps
  /** Additional API root paths for base path mappings */
  apiRootPaths?: string[]
  /** The subdomain for the API Gateway custom domain */
  apiSubDomain: string
  /** The name of the existing Lambda function to integrate with */
  lambdaFunctionName: string
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** The timezone for the application */
  timezone: string
  /** Whether to look up an existing hosted zone instead of creating one */
  useExistingHostedZone: boolean
}
