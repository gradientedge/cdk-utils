import {
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
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { Topic } from 'aws-cdk-lib/aws-sns'

import { ApiToEventBridgeTargetRestApiType } from './types.js'

/**
 * Provides a construct to contain api resources for ApiToEventBridgeTargetWithSns
 * @category Construct
 */
export class ApiToEventbridgeTargetRestApi implements ApiToEventBridgeTargetRestApiType {
  /** The CloudWatch log group for API Gateway access logs */
  accessLogGroup: LogGroup
  /** The API Gateway REST API */
  api: RestApi
  /** The SSL/TLS certificate for the custom domain */
  certificate: ICertificate
  /** The API Gateway custom domain */
  domain: DomainName
  /** The API Gateway error response model */
  errorResponseModel: Model
  /** The Route53 hosted zone for the API domain */
  hostedZone: IHostedZone
  /** The API Gateway integration with the backend service */
  integration: Integration
  /** The integration error response mapping */
  integrationErrorResponse: IntegrationResponse
  /** The integration request parameter mappings */
  integrationRequestParameters: { [p: string]: string }
  /** The integration request template mappings */
  integrationRequestTemplates: { [p: string]: string }
  /** The integration success response mapping */
  integrationResponse: IntegrationResponse
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
  /** The SNS topic for event forwarding */
  topic: Topic
  /** The IAM role for the API Gateway integration */
  role: Role
}
