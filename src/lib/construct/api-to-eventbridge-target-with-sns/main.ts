import * as cdk from 'aws-cdk-lib'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as events from 'aws-cdk-lib/aws-events'
import * as eventstargets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { ApiDestinedLambda } from './api-destined-lambda'
import {
  ApiToEventbridgeTargetEvent,
  ApiToEventBridgeTargetEventType,
  ApiToEventBridgeTargetProps,
  ApiToEventbridgeTargetRestApi,
  ApiToEventBridgeTargetRestApiType,
} from '../api-to-eventbridge-target'
import { ApiDestinedLambdaType } from './types'

/**
 * @deprecated Use ApiToEventBridgeTarget instead. This will be removed in a future release.
 * @classdesc Provides a construct to create and deploy API Gateway invocations to EventBridge
 *
 * <b>Architecture</b><br/> ![Architecture](./ApiToEventBridgeTargetWithSns.jpg)
 * @example
 * import { ApiToEventBridgeTargetWithSns, ApiToEventBridgeTargetProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends ApiToEventBridgeTargetWithSns {
 *   constructor(parent: Construct, id: string, props: ApiToEventBridgeTargetProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class ApiToEventBridgeTargetWithSns extends CommonConstruct {
  props: ApiToEventBridgeTargetProps
  id: string

  /* application related resources */
  applicationSecrets: secretsmanager.ISecret[]

  /* destined lambda related resources */
  apiDestinedLambda: ApiDestinedLambdaType

  /* event related resources */
  apiEvent: ApiToEventBridgeTargetEventType

  /* rest restApi related resources */
  apiDestinedRestApi: ApiToEventBridgeTargetRestApiType
  apiResource: string

  constructor(parent: Construct, id: string, props: ApiToEventBridgeTargetProps) {
    super(parent, id, props)

    this.props = props
    this.id = id

    this.apiDestinedLambda = new ApiDestinedLambda()
    this.apiEvent = new ApiToEventbridgeTargetEvent()
    this.apiDestinedRestApi = new ApiToEventbridgeTargetRestApi()
    this.apiResource = 'notify'
  }

  protected initResources() {
    /* application related resources */
    this.resolveSecrets()

    /* core resources */
    this.resolveHostedZone()
    this.resolveCertificate()

    /* optional custom event bus */
    this.createApiDestinedEventBus()

    /* destined lambda related resources */
    this.createApiDestinedLambdaPolicy()
    this.createApiDestinedLambdaRole()
    this.createApiDestinedLambdaEnvironment()
    this.createApiDestinedLambdaLayers()
    this.createApiDestinedLambdaDestinations()
    this.createApiDestinedLambdaFunction()

    /* event related resources */
    this.createApiDestinationLogGroupSuccess()
    this.createApiDestinationRuleSuccess()
    this.createApiDestinationLogGroupFailure()
    this.createApiDestinationRuleFailure()

    /* restApi related resources */
    this.createApiDestinedTopicRole()
    this.createApiDestinedTopic()
    this.createApiDestinedIntegrationRequestParameters()
    this.createApiDestinedIntegrationRequestTemplates()
    this.createApiDestinedIntegrationResponse()
    this.createApiDestinedIntegrationErrorResponse()
    this.createApiDestinedIntegration()
    this.createApiDestinedRestApi()
    this.createApiDestinedResource()
    this.createApiDestinedResponseModel()
    this.createApiDestinedErrorResponseModel()
    this.createApiDestinedMethodResponse()
    this.createApiDestinedMethodErrorResponse()
    this.createApiDestinedResourceMethod()
    this.createApiDomain()
    this.createApiBasePathMapping()
    this.createApiRouteAssets()
  }

  /**
   * @summary Method to resolve secrets from SecretsManager
   * - To be implemented in the overriding method in the implementation class
   */
  protected resolveSecrets() {
    this.applicationSecrets = []
  }

  /**
   * @summary Method to resolve a hosted zone based on domain attributes
   */
  protected resolveHostedZone() {
    this.apiDestinedRestApi.hostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
      `${this.id}-hosted-zone`,
      this,
      this.props.useExistingHostedZone
    )
  }

  /**
   * @summary Method to resolve a certificate based on attributes
   */
  protected resolveCertificate() {
    if (this.props.api.useExisting) return
    if (
      this.props.api.certificate.useExistingCertificate &&
      this.props.api.certificate.certificateSsmName &&
      this.props.api.certificate.certificateRegion
    ) {
      this.props.api.certificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-certificate-param`,
        this,
        this.props.api.certificate.certificateSsmName,
        this.props.api.certificate.certificateRegion
      )
    }

    this.apiDestinedRestApi.certificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.api.certificate
    )
  }

  /**
   * @summary Method to create iam policy for Api Destined Lambda function
   */
  protected createApiDestinedLambdaPolicy() {
    if (this.props.api.useExisting) return
    this.apiDestinedLambda.policy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForPutEvents([this.apiEvent.eventBus.eventBusArn])],
    })
  }

  /**
   * @summary Method to create iam role for Api Destined Lambda function
   */
  protected createApiDestinedLambdaRole() {
    if (this.props.api.useExisting) return
    this.apiDestinedLambda.role = this.iamManager.createRoleForLambda(
      `${this.id}-lambda-destined-role`,
      this,
      this.apiDestinedLambda.policy
    )
  }

  /**
   * @summary Method to create environment variables for Api Destined Lambda function
   */
  protected createApiDestinedLambdaEnvironment() {
    if (this.props.api.useExisting) return
    this.apiDestinedLambda.environment = {
      LOG_LEVEL: this.props.logLevel,
      NODE_ENV: this.props.nodeEnv,
      SOURCE_ID: this.id,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create layers for Api Destined Lambda function
   */
  protected createApiDestinedLambdaLayers() {
    if (this.props.api.useExisting) return
    const layers: lambda.LayerVersion[] = []
    if (this.props.lambda && this.props.lambda.layerSource) {
      layers.push(
        this.lambdaManager.createLambdaLayer(`${this.id}-lambda-destined-layer`, this, this.props.lambda.layerSource)
      )
    }

    this.apiDestinedLambda.layers = layers
  }

  /**
   * @summary Method to create destination for Api Destined function
   */
  protected createApiDestinedLambdaDestinations() {
    if (this.props.api.useExisting) return
    this.apiDestinedLambda.destinationSuccess = new destinations.EventBridgeDestination(this.apiEvent.eventBus)
    this.apiDestinedLambda.destinationFailure = new destinations.EventBridgeDestination(this.apiEvent.eventBus)
  }

  /**
   * @summary Method to create lambda function for Api Destined
   */
  protected createApiDestinedLambdaFunction() {
    if (this.props.api.useExisting) return
    if (!this.props.lambda || !this.props.lambda.source) throw 'Api Destined Lambda props undefined'

    this.apiDestinedLambda.function = this.lambdaManager.createLambdaFunction(
      `${this.id}-lambda-destined`,
      this,
      {
        ...this.props.lambda.function,
        ...{
          onFailure: this.apiDestinedLambda.destinationFailure,
          onSuccess: this.apiDestinedLambda.destinationSuccess,
        },
      },
      this.apiDestinedLambda.role,
      this.apiDestinedLambda.layers,
      this.props.lambda.source,
      this.props.lambda.handler ?? 'lambda.handler',
      this.apiDestinedLambda.environment
    )
  }

  /**
   * @summary Method to create or use an existing eventbus for api destined payload deliveries
   */
  protected createApiDestinedEventBus() {
    if (this.props.api.useExisting) {
      this.apiEvent.eventBus = events.EventBus.fromEventBusName(
        this,
        `${this.id}-destined-event-bus`,
        `${this.props.event.eventBusName}-${this.props.stage}`
      )
      return
    }
    this.apiEvent.eventBus = this.eventManager.createEventBus(`${this.id}-destined-event-bus`, this, {
      eventBusName: `${this.props.event.eventBusName}`,
    })
  }

  /**
   * @summary Method to create a log group for successful api destined payload deliveries
   */
  protected createApiDestinationLogGroupSuccess() {
    if (this.props.api.useExisting) return
    this.apiEvent.logGroupSuccess = this.logManager.createLogGroup(`${this.id}-destination-success-log`, this, {
      ...{
        logGroupName: `/${this.id}/events/api-destination-success`,
      },
      ...this.props.event.logGroupSuccess,
    })
  }

  /**
   * Method to create EventBridge rule with lambda target for success
   */
  protected createApiDestinationRuleSuccess() {
    if (this.props.api.useExisting) return
    this.props.event.ruleSuccess = {
      ...{
        eventPattern: {
          detail: {
            requestContext: {
              condition: ['Success'],
            },
            responsePayload: {
              source: ['custom:api-destined-lambda'],
              sourceId: [this.id],
            },
          },
        },
        ruleName: `${this.id}-api-destination-success`,
      },
      ...this.props.event.ruleSuccess,
    }
    this.apiEvent.ruleSuccess = this.eventManager.createRule(
      `${this.id}-api-destination-rule-success`,
      this,
      this.props.event.ruleSuccess,
      this.apiEvent.eventBus,
      [new eventstargets.CloudWatchLogGroup(this.apiEvent.logGroupSuccess)]
    )
  }

  /**
   * @summary Method to create a log group for failed api destined payload deliveries
   */
  protected createApiDestinationLogGroupFailure() {
    if (this.props.api.useExisting) return
    this.apiEvent.logGroupFailure = this.logManager.createLogGroup(`${this.id}-destination-failure-log`, this, {
      ...{
        logGroupName: `/${this.id}/events/api-destination-failure`,
      },
      ...this.props.event.logGroupFailure,
    })
  }

  /**
   * Method to create EventBridge rule with lambda target for failure
   */
  protected createApiDestinationRuleFailure() {
    if (this.props.api.useExisting) return
    this.props.event.ruleFailure = {
      ...{
        eventPattern: {
          detail: {
            responsePayload: {
              errorType: ['Error'],
            },
          },
        },
        ruleName: `${this.id}-api-destination-failure`,
      },
      ...this.props.event.ruleFailure,
    }
    this.apiEvent.ruleFailure = this.eventManager.createRule(
      `${this.id}-api-destination-rule-failure`,
      this,
      this.props.event.ruleFailure,
      this.apiEvent.eventBus,
      [new eventstargets.CloudWatchLogGroup(this.apiEvent.logGroupFailure)]
    )
  }

  /**
   * @summary Method to create a role for sns topic
   */
  protected createApiDestinedTopicRole() {
    this.apiDestinedRestApi.role = new iam.Role(this, `${this.id}-sns-rest-api-role`, {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    })
  }

  /**
   * @summary Method to create API destined SNS topic
   */
  protected createApiDestinedTopic() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.topic = this.snsManager.createLambdaNotificationService(
      `${this.id}-destined-topic`,
      this,
      {
        topicName: `${this.id}-destined-topic`,
      },
      this.apiDestinedLambda.function
    )

    if (this.apiDestinedRestApi.role) {
      this.apiDestinedRestApi.topic.grantPublish(this.apiDestinedRestApi.role)
    }
  }

  /**
   * @summary Method to create api integration request parameters
   */
  protected createApiDestinedIntegrationRequestParameters() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.integrationRequestParameters = {
      'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
    }
  }

  /**
   * @summary Method to create api integration request templates
   */
  protected createApiDestinedIntegrationRequestTemplates() {
    if (!this.props.api.withResource) return
    if (!this.apiDestinedRestApi.topic) throw 'Topic undefined'
    this.apiDestinedRestApi.integrationRequestTemplates = {
      'application/json': [
        'Action=Publish',
        `TargetArn=$util.urlEncode('${this.apiDestinedRestApi.topic.topicArn}')`,
        'Message=$util.urlEncode($input.body)',
        'Version=2010-03-31',
      ].join('&'),
    }
  }

  /**
   * @summary Method to create api integration response
   */
  protected createApiDestinedIntegrationResponse() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.integrationResponse = this.props.api.integrationResponse ?? {
      ...{
        responseTemplates: {
          'application/json': JSON.stringify({ message: 'Payload Submitted' }),
        },
        statusCode: '200',
      },
    }
  }

  /**
   * @summary Method to create api integration error response
   */
  protected createApiDestinedIntegrationErrorResponse() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.integrationErrorResponse = {
      ...{
        responseParameters: {
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Content-Type': "'application/json'",
        },
        responseTemplates: {
          'application/json': JSON.stringify({
            message: "$util.escapeJavaScript($input.path('$.errorMessage'))",
            state: 'error',
          }),
        },
        selectionPattern: '^\\[Error\\].*',
        statusCode: '400',
      },
      ...this.props.api.integrationErrorResponse,
    }
  }

  /**
   * @summary Method to create api integration
   */
  protected createApiDestinedIntegration() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.integration = new apig.Integration({
      integrationHttpMethod: 'POST',
      options: {
        ...{
          credentialsRole: this.apiDestinedRestApi.role,
          integrationResponses: [
            this.apiDestinedRestApi.integrationResponse,
            this.apiDestinedRestApi.integrationErrorResponse,
          ],
          passthroughBehavior: apig.PassthroughBehavior.NEVER,
          requestParameters: this.apiDestinedRestApi.integrationRequestParameters,
          requestTemplates: this.apiDestinedRestApi.integrationRequestTemplates,
        },
        ...this.props.api.integrationOptions,
      },
      type: apig.IntegrationType.AWS,
      uri: `arn:aws:apigateway:${this.props.region}:sns:path//`,
    })
  }

  /**
   * @summary Method to create api integration method response
   */
  protected createApiDestinedMethodResponse() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.methodResponse = {
      ...{
        responseModels: {
          'application/json': this.apiDestinedRestApi.responseModel,
        },
        responseParameters: {
          'method.response.header.Access-Control-Allow-Credentials': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Content-Type': true,
        },
        statusCode: '200',
      },
      ...this.props.api.methodResponse,
    }
  }

  /**
   * @summary Method to create api integration method error response
   */
  protected createApiDestinedMethodErrorResponse() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.methodErrorResponse = {
      ...{
        responseModels: {
          'application/json': this.apiDestinedRestApi.errorResponseModel,
        },
        responseParameters: {
          'method.response.header.Access-Control-Allow-Credentials': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Content-Type': true,
        },
        statusCode: '400',
      },
      ...this.props.api.methodErrorResponse,
    }
  }

  /**
   * @summary Method to create rest restApi for Api
   */
  protected createApiDestinedRestApi() {
    if (this.props.api.useExisting && this.props.api.importedRestApiRef) {
      this.apiDestinedRestApi.api = apig.RestApi.fromRestApiId(
        this,
        `${this.id}-sns-rest-api`,
        cdk.Fn.importValue(this.props.api.importedRestApiRef)
      )
      return
    }

    const accessLogGroup = this.logManager.createLogGroup(`${this.id}-sns-rest-api-access-log`, this, {
      logGroupName: `/custom/api/${this.id}-destined-rest-api-access`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    this.apiDestinedRestApi.api = new apig.RestApi(this, `${this.id}-sns-rest-api`, {
      ...{
        defaultCorsPreflightOptions: {
          allowHeaders: apig.Cors.DEFAULT_HEADERS,
          allowMethods: ['POST'],
          allowOrigins: apig.Cors.ALL_ORIGINS,
        },
        defaultIntegration: this.apiDestinedRestApi.integration,
        defaultMethodOptions: {
          methodResponses: [this.apiDestinedRestApi.methodResponse, this.apiDestinedRestApi.methodErrorResponse],
        },
        deployOptions: {
          accessLogDestination: new apig.LogGroupLogDestination(accessLogGroup),
          accessLogFormat: apig.AccessLogFormat.jsonWithStandardFields(),
          dataTraceEnabled: true,
          description: `${this.id} - ${this.props.stage} stage`,
          loggingLevel: apig.MethodLoggingLevel.INFO,
          metricsEnabled: true,
          stageName: this.props.stage,
        },
        endpointConfiguration: {
          types: [apig.EndpointType.REGIONAL],
        },
        restApiName: `${this.id}-destined-rest-api-${this.props.stage}`,
      },
      ...this.props.api,
    })
    this.addCfnOutput(`${this.id}-restApiId`, this.apiDestinedRestApi.api.restApiId)
    this.addCfnOutput(`${this.id}-restApiRootResourceId`, this.apiDestinedRestApi.api.root.resourceId)
  }

  /**
   * @summary Method to create api integration response model
   */
  protected createApiDestinedResponseModel() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.responseModel = new apig.Model(this, `${this.id}-response-model`, {
      restApi: this.apiDestinedRestApi.api,
      ...{
        contentType: 'application/json',
        modelName: 'ResponseModel',
        schema: {
          properties: { message: { type: apig.JsonSchemaType.STRING } },
          schema: apig.JsonSchemaVersion.DRAFT4,
          title: 'pollResponse',
          type: apig.JsonSchemaType.OBJECT,
        },
      },
      ...this.props.api.responseModel,
    })
  }

  /**
   * @summary Method to create api integration error response model
   */
  protected createApiDestinedErrorResponseModel() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.errorResponseModel = new apig.Model(this, `${this.id}-error-response-model`, {
      restApi: this.apiDestinedRestApi.api,
      ...{
        contentType: 'application/json',
        modelName: 'ErrorResponseModel',
        schema: {
          properties: {
            message: { type: apig.JsonSchemaType.STRING },
            state: { type: apig.JsonSchemaType.STRING },
          },
          schema: apig.JsonSchemaVersion.DRAFT4,
          title: 'errorResponse',
          type: apig.JsonSchemaType.OBJECT,
        },
      },
      ...this.props.api.errorResponseModel,
    })
  }

  /**
   * @summary Method to create api integration resource
   */
  protected createApiDestinedResource() {
    if (!this.props.api.withResource) return

    let rootResource
    if (this.props.api.withResource && this.props.api.importedRestApiRootResourceRef) {
      rootResource = apig.Resource.fromResourceAttributes(this, `${this.id}-root-resource`, {
        path: '/',
        resourceId: cdk.Fn.importValue(this.props.api.importedRestApiRootResourceRef),
        restApi: this.apiDestinedRestApi.api,
      })
    } else {
      rootResource = this.apiDestinedRestApi.api.root
    }

    this.apiDestinedRestApi.resource = rootResource.addResource(this.props.api.resource ?? this.apiResource)
  }

  /**
   * @summary Method to create api integration resource method
   */
  protected createApiDestinedResourceMethod() {
    if (!this.props.api.withResource) return
    this.apiDestinedRestApi.method = this.apiDestinedRestApi.resource.addMethod(
      'POST',
      this.apiDestinedRestApi.integration,
      {
        authorizer: this.apiDestinedRestApi.authoriser,
        methodResponses: [this.apiDestinedRestApi.methodResponse, this.apiDestinedRestApi.methodErrorResponse],
      }
    )
  }

  /**
   * @summary Method to create custom restApi domain for Api API
   */
  protected createApiDomain() {
    if (this.props.api.useExisting) return
    this.apiDestinedRestApi.domain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.apiSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`,
      this.apiDestinedRestApi.certificate
    )
  }

  /**
   * @summary Method to create base path mappings for Api API
   */
  protected createApiBasePathMapping() {
    if (this.props.api.useExisting) return
    new apig.BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      basePath: '',
      domainName: this.apiDestinedRestApi.domain,
      restApi: this.apiDestinedRestApi.api,
      stage: this.apiDestinedRestApi.api.deploymentStage,
    })
  }

  /**
   * @summary Method to create route53 records for Api API
   */
  protected createApiRouteAssets() {
    if (this.props.api.useExisting) return
    this.route53Manager.createApiGatewayARecord(
      `${this.id}-custom-domain-a-record`,
      this,
      this.props.apiSubDomain,
      this.apiDestinedRestApi.domain,
      this.apiDestinedRestApi.hostedZone,
      this.props.skipStageForARecords
    )
  }
}
