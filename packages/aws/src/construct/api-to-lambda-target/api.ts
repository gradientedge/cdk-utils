import {
  BasePathMapping,
  DomainName,
  Integration,
  IntegrationResponse,
  Method,
  MethodResponse,
  Model,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Role } from 'aws-cdk-lib/aws-iam'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { Topic } from 'aws-cdk-lib/aws-sns'

import { ApiToLambdaTargetRestApiType } from './types.js'

/**
 * Provides a construct to contain api resources for ApiToLambdaTarget
 * @category Construct
 */
export class ApiToLambdaTargetRestApi implements ApiToLambdaTargetRestApiType {
  /** The API Gateway REST API */
  api: RestApi
  /** The base path mappings for the API custom domain */
  basePathMappings: BasePathMapping[] = []
  /** The SSL/TLS certificate for the custom domain */
  certificate: ICertificate
  /** The API Gateway custom domain */
  domain: DomainName
  /** The API Gateway error response model */
  errorResponseModel: Model
  /** The Route53 hosted zone for the API domain */
  hostedZone: IHostedZone
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
  /** The API Gateway resource */
  resource: Resource
  /** The success response model */
  responseModel: Model
  /** The SNS topic */
  topic: Topic
  /** The IAM role for the API Gateway integration */
  role: Role
}
