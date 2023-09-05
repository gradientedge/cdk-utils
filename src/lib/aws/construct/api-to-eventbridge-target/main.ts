import { Fn, RemovalPolicy } from 'aws-cdk-lib'
import {
  AccessLogFormat,
  BasePathMapping,
  Cors,
  EndpointType,
  Integration,
  IntegrationType,
  JsonSchemaType,
  JsonSchemaVersion,
  LogGroupLogDestination,
  MethodLoggingLevel,
  Model,
  PassthroughBehavior,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway'
import { EventBus } from 'aws-cdk-lib/aws-events'
import { CloudWatchLogGroup } from 'aws-cdk-lib/aws-events-targets'
import { PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { ApiToEventbridgeTargetRestApi } from './api'
import { ApiToEventbridgeTargetEvent } from './event'
import {
  ApiToEventBridgeTargetEventType,
  ApiToEventBridgeTargetProps,
  ApiToEventBridgeTargetRestApiType,
} from './types'

/**
 * @classdesc Provides a construct to create and deploy API Gateway invocations to EventBridge
 *
 * <b>Architecture</b><br/> ![Architecture](./ApiToEventBridgeTarget.jpg)
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
 */
export class ApiToEventBridgeTarget extends CommonConstruct {
  props: ApiToEventBridgeTargetProps
  id: string

  /* application related resources */
  applicationSecrets: ISecret[]

  /* event related resources */
  apiEvent: ApiToEventBridgeTargetEventType

  /* rest restApi related resources */
  apiToEventBridgeTargetRestApi: ApiToEventBridgeTargetRestApiType
  apiResource: string

  constructor(parent: Construct, id: string, props: ApiToEventBridgeTargetProps) {
    super(parent, id, props)

    this.props = props
    this.id = id

    this.apiEvent = new ApiToEventbridgeTargetEvent()
    this.apiToEventBridgeTargetRestApi = new ApiToEventbridgeTargetRestApi()
    this.apiResource = 'notify'
  }

  protected initResources() {
    /* application related resources */
    this.resolveSecrets()

    /* core resources */
    this.resolveHostedZone()
    this.resolveCertificate()

    /* optional custom event bus */
    this.createApiToEventBridgeTargetEventBus()

    /* event related resources */
    this.createApiToEventBridgeTargetLogGroup()
    this.createApiToEventBridgeTargetRule()
    this.createApiToEventBridgeTargetPolicy()
    this.createApiToEventBridgeTargetRole()

    /* restApi related resources */
    this.createApiToEventBridgeTargetIntegrationRequestParameters()
    this.createApiToEventBridgeTargetIntegrationRequestTemplates()
    this.createApiToEventBridgeTargetIntegrationResponse()
    this.createApiToEventBridgeTargetIntegrationErrorResponse()
    this.createApiToEventBridgeTargetIntegration()
    this.createApiToEventBridgeTargetRestApiLogGroup()
    this.createApiToEventBridgeTargetRestApi()
    this.createApiToEventBridgeTargetResource()
    this.createApiToEventBridgeTargetResponseModel()
    this.createApiToEventBridgeTargetErrorResponseModel()
    this.createApiToEventBridgeTargetMethodResponse()
    this.createApiToEventBridgeTargetMethodErrorResponse()
    this.createApiToEventBridgeTargetResourceMethod()
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
    this.apiToEventBridgeTargetRestApi.hostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
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

    this.apiToEventBridgeTargetRestApi.certificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.api.certificate
    )
  }

  /**
   * @summary Method to create or use an existing event bus for api payload deliveries
   */
  protected createApiToEventBridgeTargetEventBus() {
    if (this.props.api.useExisting) {
      this.apiEvent.eventBus = EventBus.fromEventBusName(
        this,
        `${this.id}-event-bus`,
        `${this.props.event.eventBusName}-${this.props.stage}`
      )
      return
    }
    this.apiEvent.eventBus = this.eventManager.createEventBus(`${this.id}-event-bus`, this, {
      eventBusName: `${this.props.event.eventBusName}`,
    })
  }

  /**
   * @summary Method to create a log group for successful api payload deliveries
   */
  protected createApiToEventBridgeTargetLogGroup() {
    if (this.props.api.useExisting) return
    this.apiEvent.logGroup = this.logManager.createLogGroup(`${this.id}-log`, this, {
      ...{
        logGroupName: `/${this.id}/events/api-to-eventbridge-target`,
      },
      ...this.props.event.logGroup,
    })
  }

  /**
   * Method to create EventBridge rule with lambda target for success
   */
  protected createApiToEventBridgeTargetRule() {
    if (this.props.api.useExisting) return
    this.props.event.rule = {
      ...{
        eventPattern: {
          source: ['api-to-eventbridge-target'],
        },
        ruleName: `${this.id}-api-to-eventbridge-target`,
      },
      ...this.props.event.rule,
    }
    this.apiEvent.rule = this.eventManager.createRule(
      `${this.id}-api-to-eventbridge-target-rule`,
      this,
      this.props.event.rule,
      this.apiEvent.eventBus,
      [new CloudWatchLogGroup(this.apiEvent.logGroup)]
    )
  }

  protected createApiToEventBridgeTargetPolicy() {
    this.apiToEventBridgeTargetRestApi.policy = new PolicyDocument({
      statements: [this.iamManager.statementForPutEvents()],
    })
  }

  /**
   * @summary Method to create a role for api integration
   */
  protected createApiToEventBridgeTargetRole() {
    if (!this.apiToEventBridgeTargetRestApi.policy) throw 'Policy undefined'

    this.apiToEventBridgeTargetRestApi.role = new Role(this, `${this.id}-rest-api-role`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: { policy: this.apiToEventBridgeTargetRestApi.policy },
    })
  }

  /**
   * @summary Method to create api integration request parameters
   */
  protected createApiToEventBridgeTargetIntegrationRequestParameters() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.integrationRequestParameters = {
      'integration.request.header.Content-Type': "'application/x-www-form-urlencoded'",
    }
  }

  /**
   * @summary Method to create api integration request templates
   */
  protected createApiToEventBridgeTargetIntegrationRequestTemplates() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.integrationRequestTemplates = {
      'application/json': [
        '#set($context.requestOverride.header.X-Amz-Target = "AWSPutEvents")',
        '#set($context.requestOverride.header.Content-Type = "application/x-amz-json-1.1")',
        `{
          "Entries": [
            {
              "EventBusName": "${this.apiEvent.eventBus.eventBusName}",
              "Source": "api-to-eventbridge-target",
              "DetailType": "$util.escapeJavaScript($context.domainName)$util.escapeJavaScript($context.resourcePath)",
              "Detail": "$util.escapeJavaScript($input.body).replaceAll("\\\\'","'")"
            }
          ]
        }`,
      ].join('\r'),
    }
  }

  /**
   * @summary Method to create api integration response
   */
  protected createApiToEventBridgeTargetIntegrationResponse() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.integrationResponse = this.props.api.integrationResponse ?? {
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
  protected createApiToEventBridgeTargetIntegrationErrorResponse() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.integrationErrorResponse = {
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
  protected createApiToEventBridgeTargetIntegration() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.integration = new Integration({
      integrationHttpMethod: 'POST',
      options: {
        ...{
          credentialsRole: this.apiToEventBridgeTargetRestApi.role,
          integrationResponses: [
            this.apiToEventBridgeTargetRestApi.integrationResponse,
            this.apiToEventBridgeTargetRestApi.integrationErrorResponse,
          ],
          passthroughBehavior: PassthroughBehavior.NEVER,
          requestParameters: this.apiToEventBridgeTargetRestApi.integrationRequestParameters,
          requestTemplates: this.apiToEventBridgeTargetRestApi.integrationRequestTemplates,
        },
        ...this.props.api.integrationOptions,
      },
      type: IntegrationType.AWS,
      uri: `arn:aws:apigateway:${this.props.region}:events:path//`,
    })
  }

  /**
   * @summary Method to create api integration method response
   */
  protected createApiToEventBridgeTargetMethodResponse() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.methodResponse = {
      ...{
        responseModels: {
          'application/json': this.apiToEventBridgeTargetRestApi.responseModel,
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
  protected createApiToEventBridgeTargetMethodErrorResponse() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.methodErrorResponse = {
      ...{
        responseModels: {
          'application/json': this.apiToEventBridgeTargetRestApi.errorResponseModel,
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

  protected createApiToEventBridgeTargetRestApiLogGroup() {
    this.apiToEventBridgeTargetRestApi.accessLogGroup = this.logManager.createLogGroup(
      `${this.id}-rest-api-access-log`,
      this,
      {
        logGroupName: `/custom/api/${this.id}-rest-api-access`,
        removalPolicy: RemovalPolicy.DESTROY,
      }
    )
  }

  /**
   * @summary Method to create rest restApi for Api
   */
  protected createApiToEventBridgeTargetRestApi() {
    if (this.props.api.useExisting && this.props.api.importedRestApiRef) {
      this.apiToEventBridgeTargetRestApi.api = RestApi.fromRestApiId(
        this,
        `${this.id}-rest-api`,
        Fn.importValue(this.props.api.importedRestApiRef)
      )
      return
    }

    this.apiToEventBridgeTargetRestApi.api = new RestApi(this, `${this.id}-rest-api`, {
      ...{
        cloudWatchRole: this.props.api.restApi?.cloudWatchRole ?? true,
        defaultCorsPreflightOptions: {
          allowHeaders: Cors.DEFAULT_HEADERS,
          allowMethods: ['POST'],
          allowOrigins: Cors.ALL_ORIGINS,
        },
        defaultIntegration: this.apiToEventBridgeTargetRestApi.integration,
        defaultMethodOptions: {
          methodResponses: [
            this.apiToEventBridgeTargetRestApi.methodResponse,
            this.apiToEventBridgeTargetRestApi.methodErrorResponse,
          ],
        },
        deploy: this.props.api.restApi?.deploy ?? true,
        deployOptions: {
          accessLogDestination: new LogGroupLogDestination(this.apiToEventBridgeTargetRestApi.accessLogGroup),
          accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
          dataTraceEnabled: this.props.api.restApi?.deployOptions?.dataTraceEnabled,
          description: `${this.id} - ${this.props.stage} stage`,
          loggingLevel: MethodLoggingLevel.INFO,
          metricsEnabled: true,
          stageName: this.props.stage,
          tracingEnabled: this.props.api.restApi?.deployOptions?.tracingEnabled,
        },
        endpointConfiguration: {
          types: [EndpointType.REGIONAL],
        },
        restApiName: `${this.id}-rest-api-${this.props.stage}`,
      },
      ...this.props.api.restApi,
    })
    this.addCfnOutput(`${this.id}-restApiId`, this.apiToEventBridgeTargetRestApi.api.restApiId)
    this.addCfnOutput(`${this.id}-restApiRootResourceId`, this.apiToEventBridgeTargetRestApi.api.root.resourceId)
  }

  /**
   * @summary Method to create api integration response model
   */
  protected createApiToEventBridgeTargetResponseModel() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.responseModel = new Model(this, `${this.id}-response-model`, {
      restApi: this.apiToEventBridgeTargetRestApi.api,
      ...{
        contentType: 'application/json',
        modelName: 'ResponseModel',
        schema: {
          properties: { message: { type: JsonSchemaType.STRING } },
          schema: JsonSchemaVersion.DRAFT4,
          title: 'pollResponse',
          type: JsonSchemaType.OBJECT,
        },
      },
      ...this.props.api.responseModel,
    })
  }

  /**
   * @summary Method to create api integration error response model
   */
  protected createApiToEventBridgeTargetErrorResponseModel() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.errorResponseModel = new Model(this, `${this.id}-error-response-model`, {
      restApi: this.apiToEventBridgeTargetRestApi.api,
      ...{
        contentType: 'application/json',
        modelName: 'ErrorResponseModel',
        schema: {
          properties: {
            message: { type: JsonSchemaType.STRING },
            state: { type: JsonSchemaType.STRING },
          },
          schema: JsonSchemaVersion.DRAFT4,
          title: 'errorResponse',
          type: JsonSchemaType.OBJECT,
        },
      },
      ...this.props.api.errorResponseModel,
    })
  }

  /**
   * @summary Method to create api integration resource
   */
  protected createApiToEventBridgeTargetResource() {
    if (!this.props.api.withResource) return

    let rootResource
    if (this.props.api.withResource && this.props.api.importedRestApiRootResourceRef) {
      rootResource = Resource.fromResourceAttributes(this, `${this.id}-root-resource`, {
        path: '/',
        resourceId: Fn.importValue(this.props.api.importedRestApiRootResourceRef),
        restApi: this.apiToEventBridgeTargetRestApi.api,
      })
    } else {
      rootResource = this.apiToEventBridgeTargetRestApi.api.root
    }

    this.apiToEventBridgeTargetRestApi.resource = rootResource.addResource(this.props.api.resource ?? this.apiResource)
  }

  /**
   * @summary Method to create api integration resource method
   */
  protected createApiToEventBridgeTargetResourceMethod() {
    if (!this.props.api.withResource) return
    this.apiToEventBridgeTargetRestApi.method = this.apiToEventBridgeTargetRestApi.resource.addMethod(
      'POST',
      this.apiToEventBridgeTargetRestApi.integration,
      {
        authorizer: this.apiToEventBridgeTargetRestApi.authoriser,
        methodResponses: [
          this.apiToEventBridgeTargetRestApi.methodResponse,
          this.apiToEventBridgeTargetRestApi.methodErrorResponse,
        ],
      }
    )
  }

  /**
   * @summary Method to create custom restApi domain for Api
   */
  protected createApiDomain() {
    if (this.props.api.useExisting) return
    this.apiToEventBridgeTargetRestApi.domain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.apiSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`,
      this.apiToEventBridgeTargetRestApi.certificate
    )
  }

  /**
   * @summary Method to create base path mappings for Api
   */
  protected createApiBasePathMapping() {
    if (this.props.api.useExisting) return
    new BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      basePath: '',
      domainName: this.apiToEventBridgeTargetRestApi.domain,
      restApi: this.apiToEventBridgeTargetRestApi.api,
      stage: this.apiToEventBridgeTargetRestApi.api.deploymentStage,
    })
  }

  /**
   * @summary Method to create route53 records for Api
   */
  protected createApiRouteAssets() {
    if (this.props.api.useExisting) return
    this.route53Manager.createApiGatewayARecord(
      `${this.id}-custom-domain-a-record`,
      this,
      this.props.apiSubDomain,
      this.apiToEventBridgeTargetRestApi.domain,
      this.apiToEventBridgeTargetRestApi.hostedZone,
      this.props.skipStageForARecords
    )
  }
}
