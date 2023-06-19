import { CommonStackProps } from '../../common'
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
import { AcmProps, LambdaRestApiProps } from '../../services'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { ITopic } from 'aws-cdk-lib/aws-sns'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'

/**
 * @category cdk-utils.api-to-lambda-target
 * @subcategory Types
 */
export interface ApiToLambdaTargetRestApiType {
  api: IRestApi
  authoriser?: IAuthorizer
  basePathMappings: BasePathMapping[]
  certificate: acm.ICertificate
  domain: DomainName
  errorResponseModel: Model
  hostedZone: route53.IHostedZone
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
  topic?: ITopic
  role?: Role
  policy?: PolicyDocument
}

/**
 * @category cdk-utils.api-to-lambda-target
 * @subcategory Properties
 */
export interface ApiToLambdaTargetRestApiProps {
  resource: string
  certificate: AcmProps
  restApi: LambdaRestApiProps
  importedRestApiRef?: string
  importedRestApiRootResourceRef?: string
  useExisting: boolean
  withResource?: boolean
  methodErrorResponse: MethodResponse
  methodResponse: MethodResponse
}

/**
 * @category cdk-utils.api-to-lambda-target
 * @subcategory Properties
 */
export interface ApiToLambdaTargetProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  api: ApiToLambdaTargetRestApiProps
  lambdaFunctionName: string
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}
