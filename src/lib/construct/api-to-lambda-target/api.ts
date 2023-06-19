import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as sns from 'aws-cdk-lib/aws-sns'
import { ApiToLambdaTargetRestApiType } from './types'

/**
 * @stability stable
 * @category cdk-utils.api-to-lambda-target
 * @subcategory member
 * @classdesc Provides a construct to contain api resources for ApiToLambdaTarget
 */
export class ApiToLambdaTargetRestApi implements ApiToLambdaTargetRestApiType {
  api: apig.RestApi
  basePathMappings: apig.BasePathMapping[] = []
  certificate: acm.ICertificate
  domain: apig.DomainName
  errorResponseModel: apig.Model
  hostedZone: route53.IHostedZone
  integration: apig.Integration
  integrationErrorResponse: apig.IntegrationResponse
  integrationRequestParameters: { [p: string]: string }
  integrationRequestTemplates: { [p: string]: string }
  integrationResponse: apig.IntegrationResponse
  lambda: lambda.IFunction
  method: apig.Method
  methodErrorResponse: apig.MethodResponse
  methodResponse: apig.MethodResponse
  resource: apig.Resource
  responseModel: apig.Model
  topic: sns.Topic
  role: iam.Role
}
