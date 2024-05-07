import { Fn, RemovalPolicy } from 'aws-cdk-lib'
import {
  AccessLogFormat,
  BasePathMapping,
  Cors,
  EndpointType,
  LogGroupLogDestination,
  MethodLoggingLevel,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway'
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { ApiToAnyTargetRestApi } from './target'
import { ApiToAnyTargetProps, ApiToAnyTargetRestApiResource, ApiToAnyTargetRestApiType } from './types'

/**
 * @classdesc Provides a construct to create and deploy a shallow API Gateway
 * @example
 * import { ApiToAnyTarget, ApiToAnyTargetProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends ApiToAnyTarget {
 *   constructor(parent: Construct, id: string, props: ApiToAnyTargetProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class ApiToAnyTarget extends CommonConstruct {
  props: ApiToAnyTargetProps
  id: string

  /* application related resources */
  applicationSecrets: ISecret[]

  /* rest restApi related resources */
  apiToAnyTargetRestApi: ApiToAnyTargetRestApiType
  apiResource: string

  constructor(parent: Construct, id: string, props: ApiToAnyTargetProps) {
    super(parent, id, props)
    this.props = props
    this.id = id

    this.apiToAnyTargetRestApi = new ApiToAnyTargetRestApi()
  }

  public initResources() {
    /* application related resources */
    this.resolveSecrets()

    /* core resources */
    this.resolveHostedZone()
    this.resolveCertificate()

    /* restApi related resources */
    this.createApiToAnyTargetRestApiLogGroup()
    this.createApiToAnyTargetRestApi()
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
    this.apiToAnyTargetRestApi.hostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
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

    this.apiToAnyTargetRestApi.certificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.api.certificate
    )
  }

  protected createApiToAnyTargetRestApiLogGroup() {
    this.apiToAnyTargetRestApi.accessLogGroup = this.logManager.createLogGroup(`${this.id}-rest-api-access-log`, this, {
      logGroupName: `/custom/api/${this.id}-rest-api-access`,
      removalPolicy: RemovalPolicy.DESTROY,
    })
  }

  protected createApiToAnyTargetRestApi() {
    if (this.props.api.useExisting && this.props.api.importedRestApiRef) {
      this.apiToAnyTargetRestApi.api = RestApi.fromRestApiId(
        this,
        `${this.id}-rest-api`,
        Fn.importValue(this.props.api.importedRestApiRef)
      )
      return
    }

    this.apiToAnyTargetRestApi.api = new RestApi(this, `${this.id}-rest-api`, {
      cloudWatchRole: this.props.api.restApi?.cloudWatchRole ?? true,
      defaultCorsPreflightOptions: {
        allowHeaders: Cors.DEFAULT_HEADERS,
        allowMethods: Cors.ALL_METHODS,
        allowOrigins: Cors.ALL_ORIGINS,
      },
      defaultIntegration: this.apiToAnyTargetRestApi.integration,
      defaultMethodOptions: {
        methodResponses: [this.apiToAnyTargetRestApi.methodResponse, this.apiToAnyTargetRestApi.methodErrorResponse],
      },
      deploy: this.props.api.restApi?.deploy ?? true,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(this.apiToAnyTargetRestApi.accessLogGroup),
        accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
        dataTraceEnabled: this.props.api.restApi?.deployOptions?.dataTraceEnabled,
        description: `${this.id} - ${this.props.stage} stage`,
        loggingLevel: MethodLoggingLevel.INFO,
        metricsEnabled: true,
        stageName: this.props.stage,
        tracingEnabled: this.props.api.restApi?.deployOptions?.tracingEnabled,
      },
      endpointConfiguration: {
        types: [this.isProductionStage() ? EndpointType.EDGE : EndpointType.REGIONAL],
      },
      restApiName: `${this.id}-rest-api-${this.props.stage}`,
      ...this.props.api.restApi,
    })
    this.addCfnOutput(`${this.id}-restApiId`, this.apiToAnyTargetRestApi.api.restApiId)
    this.addCfnOutput(`${this.id}-restApiRootResourceId`, this.apiToAnyTargetRestApi.api.root.resourceId)
  }

  protected createApiToAnyTargetResource(apiResourceProps: ApiToAnyTargetRestApiResource) {
    if (!this.props.api.withResource) return
    let rootResource
    if (this.props.api.withResource && this.props.api.importedRestApiRootResourceRef) {
      rootResource = Resource.fromResourceAttributes(this, `${this.id}-root-resource-for-${apiResourceProps.path}`, {
        path: '/',
        resourceId: Fn.importValue(this.props.api.importedRestApiRootResourceRef),
        restApi: this.apiToAnyTargetRestApi.api,
      })
    } else {
      rootResource = this.apiToAnyTargetRestApi.api.root
    }

    return this.apiManager.createApiResource(
      `${this.id}-resource-${apiResourceProps.path}}`,
      this,
      apiResourceProps.parent ?? rootResource,
      apiResourceProps.path,
      apiResourceProps.integration,
      apiResourceProps.addProxy,
      apiResourceProps.authorizer,
      apiResourceProps.allowedOrigins,
      apiResourceProps.allowedMethods,
      apiResourceProps.allowedHeaders,
      apiResourceProps.methodRequestParameters,
      apiResourceProps.proxyIntegration,
      apiResourceProps.enableDefaultCors,
      apiResourceProps.mockIntegration,
      apiResourceProps.mockMethodResponses
    )
  }

  protected createApiDomain() {
    if (this.props.api.useExisting) return
    this.apiToAnyTargetRestApi.domain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.apiSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`,
      this.apiToAnyTargetRestApi.certificate
    )
  }

  protected createApiBasePathMapping() {
    if (this.props.api.useExisting) return
    new BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      basePath: '',
      domainName: this.apiToAnyTargetRestApi.domain,
      restApi: this.apiToAnyTargetRestApi.api,
      stage: this.apiToAnyTargetRestApi.api.deploymentStage,
    })
  }

  protected createApiRouteAssets() {
    if (this.props.api.useExisting) return
    this.route53Manager.createApiGatewayARecord(
      `${this.id}-custom-domain-a-record`,
      this,
      this.props.apiSubDomain,
      this.apiToAnyTargetRestApi.domain,
      this.apiToAnyTargetRestApi.hostedZone,
      this.props.skipStageForARecords
    )
  }
}
