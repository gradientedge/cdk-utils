import {
  IRestApi,
  IAuthorizer,
  BasePathMapping,
  DomainName,
  Integration,
  Method,
  MethodResponse,
  Resource,
} from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'

import { ApiToAnyTargetRestApiType } from './types.js'

/**
 * Container class to hold all REST API resources for the {@link ApiToAnyTarget} construct
 * @category Construct
 */
export class ApiToAnyTargetRestApi implements ApiToAnyTargetRestApiType {
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
