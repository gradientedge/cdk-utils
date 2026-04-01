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

export class ApiToAnyTargetRestApi implements ApiToAnyTargetRestApiType {
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
