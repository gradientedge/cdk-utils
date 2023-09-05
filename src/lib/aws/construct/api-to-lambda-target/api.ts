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
import { ApiToLambdaTargetRestApiType } from './types'

/**
 * @classdesc Provides a construct to contain api resources for ApiToLambdaTarget
 */
export class ApiToLambdaTargetRestApi implements ApiToLambdaTargetRestApiType {
  api: RestApi
  basePathMappings: BasePathMapping[] = []
  certificate: ICertificate
  domain: DomainName
  errorResponseModel: Model
  hostedZone: IHostedZone
  integration: Integration
  integrationErrorResponse: IntegrationResponse
  integrationRequestParameters: { [p: string]: string }
  integrationRequestTemplates: { [p: string]: string }
  integrationResponse: IntegrationResponse
  lambda: IFunction
  method: Method
  methodErrorResponse: MethodResponse
  methodResponse: MethodResponse
  resource: Resource
  responseModel: Model
  topic: Topic
  role: Role
}
