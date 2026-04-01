import {
  DomainName,
  IAuthorizer,
  Integration,
  IntegrationOptions,
  IntegrationResponse,
  IRestApi,
  Method,
  MethodResponse,
  Model,
  ModelOptions,
  Resource,
} from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { IEventBus, Rule } from 'aws-cdk-lib/aws-events'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { ITopic } from 'aws-cdk-lib/aws-sns'
import { CommonStackProps } from '../../common/index.js'
import { AcmProps, EventRuleProps, LambdaProps, LogProps, RestApigProps } from '../../services/index.js'

/**
 */
export interface ApiToEventBridgeTargetEventType {
  eventBus: IEventBus
  logGroup: LogGroup
  logGroupFailure: LogGroup
  logGroupSuccess: LogGroup
  rule: Rule
  ruleFailure: Rule
  ruleSuccess: Rule
}

/**
 */
export interface ApiToEventBridgeTargetRestApiType {
  accessLogGroup: LogGroup
  api: IRestApi
  authoriser?: IAuthorizer
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
  policy?: PolicyDocument
  resource: Resource
  responseModel: Model
  role?: Role
  topic?: ITopic
}

/**
 */
export interface ApiToEventBridgeTargetRestApiProps {
  certificate: AcmProps
  errorResponseModel?: ModelOptions
  importedRestApiRef?: string
  importedRestApiRootResourceRef?: string
  integrationErrorResponse?: IntegrationResponse
  integrationOptions?: IntegrationOptions
  integrationResponse?: IntegrationResponse
  methodErrorResponse?: MethodResponse
  methodResponse?: MethodResponse
  resource: string
  responseModel?: ModelOptions
  restApi?: RestApigProps
  useExisting: boolean
  withResource?: boolean
}

/**
 */
interface ApiToEventBridgeTargetLambdaProps {
  function: LambdaProps
  handler?: string
  layerSource?: AssetCode
  source?: AssetCode
}

/**
 */
interface ApiToEventBridgeTargetEventProps {
  eventBusName?: string
  logGroup?: LogProps
  logGroupFailure?: LogProps
  logGroupSuccess?: LogProps
  rule: EventRuleProps
  ruleFailure: EventRuleProps
  ruleSuccess: EventRuleProps
}

/**
 */
export interface ApiToEventBridgeTargetProps extends CommonStackProps {
  api: ApiToEventBridgeTargetRestApiProps
  apiRootPaths?: string[]
  apiSubDomain: string
  event: ApiToEventBridgeTargetEventProps
  lambda?: ApiToEventBridgeTargetLambdaProps
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}
