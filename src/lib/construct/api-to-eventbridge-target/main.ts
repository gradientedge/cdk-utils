import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as eventstargets from 'aws-cdk-lib/aws-events-targets'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as destinations from 'aws-cdk-lib/aws-lambda-destinations'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import * as types from '../../types'
import { ApiDestinationEvent } from './api-destination-event'
import { ApiDestinedLambda } from './api-destined-lambda'
import { ApiDestinedRestApi } from './api-destined-rest-api'

/**
 * @stability stable
 * @category cdk-utils.api-to-eventbridge-target
 * @subcategory construct
 * @classdesc Provides a construct to create and deploy API Gateway invocations to EventBridge
 *
 * <b>Architecture</b> ![Architecture](./ApiToEventBridgeTarget.jpg)
 *
 * @example
 * import { ApiToEventBridgeTarget, ApiToEventBridgeTargetProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends ApiToEventBridgeTarget {
 *   constructor(parent: Construct, id: string, props: ApiToEventBridgeTargetProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 *
 */
export class ApiToEventBridgeTarget extends CommonConstruct {
  props: types.ApiToEventBridgeTargetProps
  id: string

  /* application related resources */
  applicationSecrets: secretsmanager.ISecret[]

  /* destined lambda related resources */
  apiDestinedLambdaDirectory = 'app/api-destined-function'
  apiDestinedLambda: types.ApiDestinedLambdaType

  /* event related resources */
  apiEvent: types.ApiDestinationEventType

  /* rest restApi related resources */
  apiDestinedRestApi: types.ApiDestinedRestApiType
  apiDestinedBasePathMappings: apig.BasePathMapping[] = []
  apiResource: string

  constructor(parent: Construct, id: string, props: types.ApiToEventBridgeTargetProps) {
    super(parent, id, props)

    this.props = props
    this.id = id

    this.apiDestinedLambda = new ApiDestinedLambda()
    this.apiEvent = new ApiDestinationEvent()
    this.apiDestinedRestApi = new ApiDestinedRestApi()
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
    this.createApiDestinedRestApi()
    this.createApiDestinedResponseModel()
    this.createApiDestinedErrorResponseModel()
    this.createApiDestinedResource()
    this.createApiDestinedIntegrationRequestParameters()
    this.createApiDestinedIntegrationRequestTemplates()
    this.createApiDestinedIntegrationResponse()
    this.createApiDestinedIntegrationErrorResponse()
    this.createApiDestinedIntegration()
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
   * @protected
   */
  protected resolveSecrets() {
    this.applicationSecrets = []
  }

  /**
   * @summary Method to resolve a hosted zone based on domain attributes
   * @protected
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
   * @protected
   */
  protected resolveCertificate() {
    if (
      this.props.api.certificate.useExistingCertificate &&
      this.props.api.certificate.certificateSsmName &&
      this.props.api.certificate.certificateRegion
    ) {
      this.props.api.certificate.certificateArn = this.ssMManager.readStringParameterFromRegion(
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
   * @protected
   */
  protected createApiDestinedLambdaPolicy() {
    this.apiDestinedLambda.policy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForReadSecrets(this), this.iamManager.statementForPutEvents()],
    })
  }

  /**
   * @summary Method to create iam role for Api Destined Lambda function
   * @protected
   */
  protected createApiDestinedLambdaRole() {
    this.apiDestinedLambda.role = this.iamManager.createRoleForLambda(
      `${this.id}-lambda-destined-role`,
      this,
      this.apiDestinedLambda.policy
    )
  }

  /**
   * @summary Method to create environment variables for Api Destined Lambda function
   * @protected
   */
  protected createApiDestinedLambdaEnvironment() {
    this.apiDestinedLambda.environment = {
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
      SOURCE_ID: this.id,
    }
  }

  private createApiDestinedLambdaLayersSource() {
    return this.props.lambda.useNative
      ? lambda.AssetCode.fromAsset(`${this.apiDestinedLambdaDirectory}/layers`)
      : lambda.AssetCode.fromAsset(
          `../node_modules/@gradientedge/cdk-utils/dist/${this.apiDestinedLambdaDirectory}/layers`
        )
  }

  /**
   * @summary Method to create layers for Api Destined Lambda function
   * @protected
   */
  protected createApiDestinedLambdaLayers() {
    const layers: lambda.LayerVersion[] = []
    layers.push(
      this.lambdaManager.createLambdaLayer(
        `${this.id}-lambda-destined-layer`,
        this,
        this.createApiDestinedLambdaLayersSource()
      )
    )
    this.apiDestinedLambda.layers = layers
  }

  /**
   * @summary Method to create destination for Api Destined function
   * @protected
   */
  protected createApiDestinedLambdaDestinations() {
    this.apiDestinedLambda.destinationSuccess = new destinations.EventBridgeDestination(this.apiEvent.eventBus)
    this.apiDestinedLambda.destinationFailure = new destinations.EventBridgeDestination(this.apiEvent.eventBus)
  }

  private createApiDestinedLambdaFunctionSource() {
    return this.props.lambda.useNative
      ? lambda.AssetCode.fromAsset(`${this.apiDestinedLambdaDirectory}/src/lib`)
      : lambda.AssetCode.fromAsset(
          `../node_modules/@gradientedge/cdk-utils/dist/${this.apiDestinedLambdaDirectory}/src/lib`
        )
  }

  /**
   * @summary Method to create lambda function for Api Destined
   * @protected
   */
  protected createApiDestinedLambdaFunction() {
    this.apiDestinedLambda.function = this.lambdaManager.createLambdaFunction(
      `${this.id}-lambda-destined`,
      this,
      {
        ...this.props.lambda.function,
        ...{
          onSuccess: this.apiDestinedLambda.destinationSuccess,
          onFailure: this.apiDestinedLambda.destinationFailure,
        },
      },
      this.apiDestinedLambda.role,
      this.apiDestinedLambda.layers,
      this.createApiDestinedLambdaFunctionSource(),
      'lambda.handler',
      this.apiDestinedLambda.environment
    )
  }

  protected createApiDestinedEventBus() {
    this.apiEvent.eventBus = this.eventManager.createEventBus(`${this.id}-destined-event-bus`, this, {
      eventBusName: `${this.props.event.eventBusName}`,
    })
  }

  protected createApiDestinationLogGroupSuccess() {
    this.apiEvent.logGroupSuccess = this.logManager.createLogGroup(`${this.id}-destination-success-log`, this, {
      ...{
        logGroupName: `/${this.id}/events/api-destination-success`,
      },
      ...this.props.event.logGroupSuccess,
    })
  }

  /**
   * Method to create EventBridge rule with lambda target for success
   * @protected
   */
  protected createApiDestinationRuleSuccess() {
    this.props.event.ruleSuccess = {
      ...{
        ruleName: `${this.id}-api-destination-success`,
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

  protected createApiDestinationLogGroupFailure() {
    this.apiEvent.logGroupFailure = this.logManager.createLogGroup(`${this.id}-destination-failure-log`, this, {
      ...{
        logGroupName: `/${this.id}/events/api-destination-failure`,
      },
      ...this.props.event.logGroupFailure,
    })
  }

  /**
   * Method to create EventBridge rule with lambda target for failure
   * @protected
   */
  protected createApiDestinationRuleFailure() {
    this.props.event.ruleFailure = {
      ...{
        ruleName: `${this.id}-api-destination-failure`,
        eventPattern: {
          detail: {
            responsePayload: {
              errorType: ['Error'],
            },
          },
        },
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

  protected createApiDestinedTopicRole() {
    this.apiDestinedRestApi.topicRole = new iam.Role(this, `${this.id}-sns-rest-api-role`, {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
    })
  }

  protected createApiDestinedTopic() {
    this.apiDestinedRestApi.topic = this.snsManager.createLambdaNotificationService(
      `${this.id}-destined-topic`,
      this,
      {
        topicName: `${this.id}-destined-topic`,
      },
      this.apiDestinedLambda.function
    )

    this.apiDestinedRestApi.topic.grantPublish(this.apiDestinedRestApi.topicRole)
  }

  /**
   * @summary Method to create rest restApi for Api
   * @protected
   */
  protected createApiDestinedRestApi() {
    this.apiDestinedRestApi.api = new apig.RestApi(this, `${this.id}-sns-rest-api`, {
      ...{
        deployOptions: {
          dataTraceEnabled: true,
          description: `${this.id} - ${this.props.stage} stage`,
          loggingLevel: apig.MethodLoggingLevel.INFO,
          metricsEnabled: true,
          stageName: this.props.stage,
        },
        endpointConfiguration: {
          types: [apig.EndpointType.REGIONAL],
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apig.Cors.ALL_ORIGINS,
          allowMethods: ['POST'],
          allowHeaders: apig.Cors.DEFAULT_HEADERS,
        },
        restApiName: `${this.id}-destined-rest-api-${this.props.stage}`,
      },
      ...this.props.api,
    })
  }

  protected createApiDestinedResponseModel() {
    this.apiDestinedRestApi.responseModel = this.apiDestinedRestApi.api.addModel(`${this.id}-response-model`, {
      ...{
        contentType: 'application/json',
        modelName: 'ResponseModel',
        schema: {
          schema: apig.JsonSchemaVersion.DRAFT4,
          title: 'pollResponse',
          type: apig.JsonSchemaType.OBJECT,
          properties: { message: { type: apig.JsonSchemaType.STRING } },
        },
      },
      ...this.props.api.responseModel,
    })
  }

  protected createApiDestinedErrorResponseModel() {
    this.apiDestinedRestApi.errorResponseModel = this.apiDestinedRestApi.api.addModel(
      `${this.id}-error-response-model`,
      {
        ...{
          contentType: 'application/json',
          modelName: 'ErrorResponseModel',
          schema: {
            schema: apig.JsonSchemaVersion.DRAFT4,
            title: 'errorResponse',
            type: apig.JsonSchemaType.OBJECT,
            properties: {
              state: { type: apig.JsonSchemaType.STRING },
              message: { type: apig.JsonSchemaType.STRING },
            },
          },
        },
        ...this.props.api.errorResponseModel,
      }
    )
  }

  protected createApiDestinedResource() {
    this.apiDestinedRestApi.resource = this.apiDestinedRestApi.api.root.addResource(
      this.props.api.resource ?? this.apiResource
    )
  }

  protected createApiDestinedIntegrationRequestParameters() {
    this.apiDestinedRestApi.integrationRequestParameters = {
      'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
    }
  }

  protected createApiDestinedIntegrationRequestTemplates() {
    this.apiDestinedRestApi.integrationRequestTemplates = {
      'application/json': [
        'Action=Publish',
        `TargetArn=$util.urlEncode('${this.apiDestinedRestApi.topic.topicArn}')`,
        'Message=$input.body',
        'Version=2010-03-31',
      ].join('&'),
    }
  }

  protected createApiDestinedIntegrationResponse() {
    this.apiDestinedRestApi.integrationResponse = {
      ...{
        statusCode: '200',
        responseTemplates: {
          'application/json': JSON.stringify({ message: 'Payload Submitted' }),
        },
      },
      ...this.props.api.integrationResponse,
    }
  }

  protected createApiDestinedIntegrationErrorResponse() {
    this.apiDestinedRestApi.integrationErrorResponse = {
      ...{
        selectionPattern: '^\\[Error\\].*',
        statusCode: '400',
        responseTemplates: {
          'application/json': JSON.stringify({
            state: 'error',
            message: "$util.escapeJavaScript($input.path('$.errorMessage'))",
          }),
        },
        responseParameters: {
          'method.response.header.Content-Type': "'application/json'",
          'method.response.header.Access-Control-Allow-Origin': "'*'",
          'method.response.header.Access-Control-Allow-Credentials': "'true'",
        },
      },
      ...this.props.api.integrationErrorResponse,
    }
  }

  protected createApiDestinedIntegration() {
    this.apiDestinedRestApi.integration = new apig.Integration({
      type: apig.IntegrationType.AWS,
      integrationHttpMethod: 'POST',
      uri: `arn:aws:apigateway:${this.props.region}:sns:path//`,
      options: {
        ...{
          credentialsRole: this.apiDestinedRestApi.topicRole,
          requestParameters: this.apiDestinedRestApi.integrationRequestParameters,
          requestTemplates: this.apiDestinedRestApi.integrationRequestTemplates,
          passthroughBehavior: apig.PassthroughBehavior.NEVER,
          integrationResponses: [
            this.apiDestinedRestApi.integrationResponse,
            this.apiDestinedRestApi.integrationErrorResponse,
          ],
        },
        ...this.props.api.integrationOptions,
      },
    })
  }

  protected createApiDestinedMethodResponse() {
    this.apiDestinedRestApi.methodResponse = {
      ...{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
        responseModels: {
          'application/json': this.apiDestinedRestApi.responseModel,
        },
      },
      ...this.props.api.methodResponse,
    }
  }

  protected createApiDestinedMethodErrorResponse() {
    this.apiDestinedRestApi.methodErrorResponse = {
      ...{
        statusCode: '400',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
        responseModels: {
          'application/json': this.apiDestinedRestApi.errorResponseModel,
        },
      },
      ...this.props.api.methodErrorResponse,
    }
  }

  protected createApiDestinedResourceMethod() {
    this.apiDestinedRestApi.method = this.apiDestinedRestApi.resource.addMethod(
      'POST',
      this.apiDestinedRestApi.integration,
      {
        methodResponses: [this.apiDestinedRestApi.methodResponse, this.apiDestinedRestApi.methodErrorResponse],
      }
    )
  }

  /**
   * @summary Method to create custom restApi domain for Api API
   * @protected
   */
  protected createApiDomain() {
    this.apiDestinedRestApi.domain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      this.isProductionStage()
        ? `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.apiSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`,
      this.apiDestinedRestApi.certificate
    )
  }

  /**
   * @summary Method to create base path mappings for Api API
   * @protected
   */
  protected createApiBasePathMapping() {
    const apiRootPaths = this.props.apiRootPaths
    if (apiRootPaths && apiRootPaths.length > 0) {
      apiRootPaths.forEach((apiRootPath: string) => {
        this.apiDestinedBasePathMappings.push(
          new apig.BasePathMapping(this, `${this.id}-base-bath-mapping-${apiRootPath}`, {
            basePath: this.props.api.resource,
            domainName: this.apiDestinedRestApi.domain,
            restApi: this.apiDestinedRestApi.api,
            stage: this.apiDestinedRestApi.api.deploymentStage,
          })
        )
      })
    }
  }

  /**
   * @summary Method to create route53 records for Api API
   * @protected
   */
  protected createApiRouteAssets() {
    this.route53Manager.createApiGatewayARecord(
      `${this.id}-custom-domain-a-record`,
      this,
      this.props.apiSubDomain,
      this.apiDestinedRestApi.domain,
      this.apiDestinedRestApi.hostedZone
    )
  }
}