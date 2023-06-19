import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as sns from 'aws-cdk-lib/aws-sns'
import { ApiToEventBridgeTargetRestApiType } from './types'

/**
 * @stability stable
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory member
 * @classdesc Provides a construct to contain api resources for ApiToEventBridgeTargetWithSns
 */
export class ApiToEventbridgeTargetRestApi implements ApiToEventBridgeTargetRestApiType {
  accessLogGroup: logs.LogGroup
  api: apig.RestApi
  certificate: acm.ICertificate
  domain: apig.DomainName
  errorResponseModel: apig.Model
  hostedZone: route53.IHostedZone
  integration: apig.Integration
  integrationErrorResponse: apig.IntegrationResponse
  integrationRequestParameters: { [p: string]: string }
  integrationRequestTemplates: { [p: string]: string }
  integrationResponse: apig.IntegrationResponse
  method: apig.Method
  methodErrorResponse: apig.MethodResponse
  methodResponse: apig.MethodResponse
  resource: apig.Resource
  responseModel: apig.Model
  topic: sns.Topic
  role: iam.Role
}
