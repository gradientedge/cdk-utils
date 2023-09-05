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
import { ApiToEventBridgeTargetRestApiType } from './types'

/**
 * @classdesc Provides a construct to contain api resources for ApiToEventBridgeTargetWithSns
 */
export class ApiToEventbridgeTargetRestApi implements ApiToEventBridgeTargetRestApiType {
  accessLogGroup: LogGroup
  api: RestApi
  certificate: ICertificate
  domain: DomainName
  errorResponseModel: Model
  hostedZone: IHostedZone
  integration: Integration
  integrationErrorResponse: IntegrationResponse
  integrationRequestParameters: { [p: string]: string }
  integrationRequestTemplates: { [p: string]: string }
  integrationResponse: IntegrationResponse
  method: Method
  methodErrorResponse: MethodResponse
  methodResponse: MethodResponse
  resource: Resource
  responseModel: Model
  topic: Topic
  role: Role
}
