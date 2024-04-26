import {
  BasePathMapping,
  DomainName,
  IAuthorizer,
  IResource,
  IRestApi,
  Integration,
  Method,
  MethodResponse,
  Resource,
  RestApiProps,
} from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { CommonStackProps } from '../../common'
import { AcmProps } from '../../services'

export interface ApiToAnyTargetRestApiType {
  accessLogGroup: LogGroup
  api: IRestApi
  authoriser?: IAuthorizer
  basePathMappings: BasePathMapping[]
  certificate: ICertificate
  domain: DomainName
  hostedZone: IHostedZone
  integration: Integration
  method: { [httpMethod: string]: Method }
  methodErrorResponse: MethodResponse
  methodResponse: MethodResponse
  resource: { [path: string]: Resource }
}

export interface ApiToAnyTargetRestApiResource {
  addProxy: boolean
  authorizer?: IAuthorizer
  allowedOrigins?: string[]
  allowedMethods?: string[]
  allowedHeaders?: string[]
  integration: Integration
  methodRequestParameters?: { [param: string]: boolean }
  path: string
  parent?: IResource
  proxyIntegration?: Integration
  enableDefaultCors?: boolean
}

export interface ApiToAnyTargetRestApiProps {
  certificate: AcmProps
  importedRestApiRef?: string
  importedRestApiRootResourceRef?: string
  methodErrorResponse: MethodResponse
  methodResponse: MethodResponse
  restApi: RestApiProps
  useExisting: boolean
  withResource?: boolean
}

export interface ApiToAnyTargetProps extends CommonStackProps {
  api: ApiToAnyTargetRestApiProps
  apiRootPaths?: string[]
  apiSubDomain: string
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}
