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
  policy?: PolicyDocument
  resource: Resource
  responseModel: Model
  role?: Role
  topic?: ITopic
}

/**
 */
export interface ApiToLambdaTargetRestApiProps {
  certificate: AcmProps
  importedRestApiRef?: string
  importedRestApiRootResourceRef?: string
  methodErrorResponse: MethodResponse
  methodResponse: MethodResponse
  resource: string
  restApi: LambdaRestApiProps
  useExisting: boolean
  withResource?: boolean
}

/**
 */
export interface ApiToLambdaTargetProps extends CommonStackProps {
  api: ApiToLambdaTargetRestApiProps
  apiRootPaths?: string[]
  apiSubDomain: string
  lambdaFunctionName: string
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}
