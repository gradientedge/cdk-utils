import { IEventBus, Rule } from 'aws-cdk-lib/aws-events'
import { LogGroup } from 'aws-cdk-lib/aws-logs'
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
  RestApiProps,
} from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { ITopic } from 'aws-cdk-lib/aws-sns'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { CommonStackProps } from '../../common'
import { AcmProps, EventRuleProps, LambdaProps, LogProps } from '../../services'
import { AssetCode } from 'aws-cdk-lib/aws-lambda'

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
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
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Types
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
  resource: Resource
  responseModel: Model
  topic?: ITopic
  role?: Role
  policy?: PolicyDocument
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
export interface ApiToEventBridgeTargetRestApiProps {
  certificate: AcmProps
  integrationResponse?: IntegrationResponse
  integrationErrorResponse?: IntegrationResponse
  methodResponse?: MethodResponse
  methodErrorResponse?: MethodResponse
  integrationOptions?: IntegrationOptions
  resource: string
  errorResponseModel?: ModelOptions
  responseModel?: ModelOptions
  restApi?: RestApiProps
  importedRestApiRef?: string
  importedRestApiRootResourceRef?: string
  useExisting: boolean
  withResource?: boolean
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
interface ApiToEventBridgeTargetLambdaProps {
  handler?: string
  function: LambdaProps
  source?: AssetCode
  layerSource?: AssetCode
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
interface ApiToEventBridgeTargetEventProps {
  eventBusName?: string
  logGroup?: LogProps
  logGroupSuccess?: LogProps
  logGroupFailure?: LogProps
  rule: EventRuleProps
  ruleSuccess: EventRuleProps
  ruleFailure: EventRuleProps
}

/**
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory Properties
 */
export interface ApiToEventBridgeTargetProps extends CommonStackProps {
  apiRootPaths?: string[]
  apiSubDomain: string
  api: ApiToEventBridgeTargetRestApiProps
  event: ApiToEventBridgeTargetEventProps
  lambda?: ApiToEventBridgeTargetLambdaProps
  logLevel: string
  nodeEnv: string
  timezone: string
  useExistingHostedZone: boolean
}
