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
 * Type definition for EventBridge event resources used by the {@link ApiToEventBridgeTarget} construct
 */
/** @category Interface */
export interface ApiToEventBridgeTargetEventType {
  /** The EventBridge event bus */
  eventBus: IEventBus
  /** The CloudWatch log group for event logging */
  logGroup: LogGroup
  /** The CloudWatch log group for failed event deliveries */
  logGroupFailure: LogGroup
  /** The CloudWatch log group for successful event deliveries */
  logGroupSuccess: LogGroup
  /** The EventBridge rule for routing events */
  rule: Rule
  /** The EventBridge rule for failed event deliveries */
  ruleFailure: Rule
  /** The EventBridge rule for successful event deliveries */
  ruleSuccess: Rule
}

/**
 * Type definition for REST API resources used by the {@link ApiToEventBridgeTarget} construct
 */
/** @category Interface */
export interface ApiToEventBridgeTargetRestApiType {
  /** The CloudWatch log group for API Gateway access logs */
  accessLogGroup: LogGroup
  /** The API Gateway REST API */
  api: IRestApi
  /** The optional API Gateway authorizer */
  authoriser?: IAuthorizer
  /** The SSL/TLS certificate for the custom domain */
  certificate: ICertificate
  /** The API Gateway custom domain */
  domain: DomainName
  /** The API Gateway error response model */
  errorResponseModel: Model
  /** The Route53 hosted zone for the API domain */
  hostedZone: IHostedZone
  /** The API Gateway integration with EventBridge */
  integration: Integration
  /** The API Gateway integration error response mapping */
  integrationErrorResponse: IntegrationResponse
  /** The API Gateway integration request parameter mappings */
  integrationRequestParameters: { [p: string]: string }
  /** The API Gateway integration request template mappings */
  integrationRequestTemplates: { [p: string]: string }
  /** The API Gateway integration success response mapping */
  integrationResponse: IntegrationResponse
  /** The API Gateway resource method */
  method: Method
  /** The API Gateway method error response */
  methodErrorResponse: MethodResponse
  /** The API Gateway method success response */
  methodResponse: MethodResponse
  /** The IAM policy for the API Gateway integration role */
  policy?: PolicyDocument
  /** The API Gateway resource */
  resource: Resource
  /** The API Gateway success response model */
  responseModel: Model
  /** The IAM role for the API Gateway integration */
  role?: Role
  /** The optional SNS topic for event forwarding */
  topic?: ITopic
}

/**
 * Properties for configuring the REST API in the {@link ApiToEventBridgeTarget} construct
 */
/** @category Interface */
export interface ApiToEventBridgeTargetRestApiProps {
  /** The SSL/TLS certificate configuration */
  certificate: AcmProps
  /** Custom error response model options */
  errorResponseModel?: ModelOptions
  /** CloudFormation export name for an existing REST API ID */
  importedRestApiRef?: string
  /** CloudFormation export name for an existing REST API root resource ID */
  importedRestApiRootResourceRef?: string
  /** Custom integration error response configuration */
  integrationErrorResponse?: IntegrationResponse
  /** Custom integration options */
  integrationOptions?: IntegrationOptions
  /** Custom integration success response configuration */
  integrationResponse?: IntegrationResponse
  /** Custom method error response configuration */
  methodErrorResponse?: MethodResponse
  /** Custom method success response configuration */
  methodResponse?: MethodResponse
  /** The API resource path name */
  resource: string
  /** Custom success response model options */
  responseModel?: ModelOptions
  /** REST API configuration properties */
  restApi?: RestApigProps
  /** Whether to use an existing REST API instead of creating a new one */
  useExisting: boolean
  /** Whether to create a resource and method on the REST API */
  withResource?: boolean
}

/**
 * Properties for configuring the Lambda function in the {@link ApiToEventBridgeTarget} construct
 */
/** @category Interface */
export interface ApiToEventBridgeTargetLambdaProps {
  /** The Lambda function configuration */
  function: LambdaProps
  /** The Lambda handler entry point */
  handler?: string
  /** The Lambda layer source code asset */
  layerSource?: AssetCode
  /** The Lambda function source code asset */
  source?: AssetCode
}

/**
 * Properties for configuring EventBridge events in the {@link ApiToEventBridgeTarget} construct
 */
/** @category Interface */
export interface ApiToEventBridgeTargetEventProps {
  /** The name of the custom event bus (defaults to 'default') */
  eventBusName?: string
  /** Log group configuration for event logging */
  logGroup?: LogProps
  /** Log group configuration for failed event deliveries */
  logGroupFailure?: LogProps
  /** Log group configuration for successful event deliveries */
  logGroupSuccess?: LogProps
  /** The EventBridge rule configuration */
  rule: EventRuleProps
  /** The EventBridge rule configuration for failures */
  ruleFailure: EventRuleProps
  /** The EventBridge rule configuration for successes */
  ruleSuccess: EventRuleProps
}

/**
 * Properties for configuring an {@link ApiToEventBridgeTarget} construct
 */
/** @category Interface */
export interface ApiToEventBridgeTargetProps extends CommonStackProps {
  /** REST API configuration */
  api: ApiToEventBridgeTargetRestApiProps
  /** Additional API root paths for base path mappings */
  apiRootPaths?: string[]
  /** The subdomain for the API Gateway custom domain */
  apiSubDomain: string
  /** EventBridge event configuration */
  event: ApiToEventBridgeTargetEventProps
  /** Optional Lambda function configuration for event processing */
  lambda?: ApiToEventBridgeTargetLambdaProps
  /** The application log level */
  logLevel: string
  /** The Node.js environment (e.g. development, production) */
  nodeEnv: string
  /** The timezone for the application */
  timezone: string
  /** Whether to look up an existing hosted zone instead of creating one */
  useExistingHostedZone: boolean
}
