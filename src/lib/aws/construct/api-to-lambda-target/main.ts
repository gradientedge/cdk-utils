import { Fn, RemovalPolicy } from 'aws-cdk-lib'
import {
  BasePathMapping,
  LambdaIntegration,
  LogGroupLogDestination,
  Resource,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway'
import { PolicyDocument, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Function } from 'aws-cdk-lib/aws-lambda'
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { ApiToLambdaTargetRestApi } from './api'
import { ApiToLambdaTargetProps, ApiToLambdaTargetRestApiType } from './types'

/**
 */
export class ApiToLambdaTarget extends CommonConstruct {
  props: ApiToLambdaTargetProps
  id: string

  /* application related resources */
  applicationSecrets: ISecret[]

  /* rest restApi related resources */
  apiToLambdaTargetRestApi: ApiToLambdaTargetRestApiType
  apiResource: string

  constructor(parent: Construct, id: string, props: ApiToLambdaTargetProps) {
    super(parent, id, props)

    this.props = props
    this.id = id

    this.apiToLambdaTargetRestApi = new ApiToLambdaTargetRestApi()
  }

  public initResources() {
    this.resolveSecrets()
    this.resolveHostedZone()
    this.resolveCertificate()
    this.createApiToLambdaTargetMethodResponse()
    this.createApiToLambdaTargetMethodErrorResponse()
    this.resolveApiToLambdaTargetFunction()
    this.createApiToLambdaTargetRestApi()
    this.createApiToLambdaTargetResource()
    this.createApiToLambdaTargetPolicy()
    this.createApiToLambdaTargetRole()
    this.createApiToLambdaTargetIntegration()
    this.createApiToLambdaTargetResourceMethod()
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
    this.apiToLambdaTargetRestApi.hostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
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

    this.apiToLambdaTargetRestApi.certificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.api.certificate
    )
  }

  /**
   * @summary Method to create api integration method response
   */
  protected createApiToLambdaTargetMethodResponse() {
    if (!this.props.api.withResource) return
    this.apiToLambdaTargetRestApi.methodResponse = {
      ...{
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
  protected createApiToLambdaTargetMethodErrorResponse() {
    if (!this.props.api.withResource) return
    this.apiToLambdaTargetRestApi.methodErrorResponse = {
      ...{
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

  protected resolveApiToLambdaTargetFunction() {
    this.apiToLambdaTargetRestApi.lambda = Function.fromFunctionName(
      this,
      `${this.id}-lambda`,
      this.resourceNameFormatter.format(this.props.lambdaFunctionName)
    )
  }

  /**
   * @summary Method to create rest restApi for Api
   */
  protected createApiToLambdaTargetRestApi() {
    if (this.props.api.useExisting && this.props.api.importedRestApiRef) {
      this.apiToLambdaTargetRestApi.api = RestApi.fromRestApiId(
        this,
        `${this.id}-rest-api`,
        Fn.importValue(this.props.api.importedRestApiRef)
      )
      return
    }

    const accessLogGroup = this.logManager.createLogGroup(`${this.id}-rest-api-access-log`, this, {
      logGroupName: `/custom/api/${this.resourceNameFormatter.format(this.id)}-rest-api-access`,
      removalPolicy: RemovalPolicy.DESTROY,
    })

    this.props.api.restApi = {
      ...this.props.api.restApi,
      defaultMethodOptions: {
        methodResponses: [
          this.apiToLambdaTargetRestApi.methodResponse,
          this.apiToLambdaTargetRestApi.methodErrorResponse,
        ],
      },
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(accessLogGroup),
      },
    }

    this.apiToLambdaTargetRestApi.api = this.apiManager.createLambdaRestApi(
      `${this.id}-lambda-rest-api`,
      this,
      this.props.api.restApi,
      this.apiToLambdaTargetRestApi.lambda
    )

    this.addCfnOutput(`${this.id}-restApiId`, this.apiToLambdaTargetRestApi.api.restApiId)
    this.addCfnOutput(`${this.id}-restApiRootResourceId`, this.apiToLambdaTargetRestApi.api.root.resourceId)
  }

  /**
   * @summary Method to create api integration resource
   */
  protected createApiToLambdaTargetResource() {
    if (!this.props.api.withResource) return

    let rootResource
    if (this.props.api.withResource && this.props.api.importedRestApiRootResourceRef) {
      rootResource = Resource.fromResourceAttributes(this, `${this.id}-root-resource`, {
        path: '/',
        resourceId: Fn.importValue(this.props.api.importedRestApiRootResourceRef),
        restApi: this.apiToLambdaTargetRestApi.api,
      })
    } else {
      rootResource = this.apiToLambdaTargetRestApi.api.root
    }

    this.apiToLambdaTargetRestApi.resource = rootResource.addResource(this.props.api.resource ?? this.apiResource)
  }

  protected createApiToLambdaTargetPolicy() {
    this.apiToLambdaTargetRestApi.policy = new PolicyDocument({
      statements: [
        this.iamManager.statementForPutEvents(),
        this.iamManager.statementForInvokeLambda([this.apiToLambdaTargetRestApi.lambda.functionArn]),
      ],
    })
  }

  /**
   * @summary Method to create a role for api integration
   */
  protected createApiToLambdaTargetRole() {
    if (!this.apiToLambdaTargetRestApi.policy) throw 'Policy undefined'

    this.apiToLambdaTargetRestApi.role = new Role(this, `${this.id}-rest-api-role`, {
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com'),
      inlinePolicies: { policy: this.apiToLambdaTargetRestApi.policy },
    })
  }

  /**
   * @summary Method to create api integration resource method
   */
  protected createApiToLambdaTargetIntegration() {
    this.apiToLambdaTargetRestApi.integration = new LambdaIntegration(this.apiToLambdaTargetRestApi.lambda, {
      allowTestInvoke: true,
      credentialsRole: this.apiToLambdaTargetRestApi.role,
    })
  }

  /**
   * @summary Method to create api integration resource method
   */
  protected createApiToLambdaTargetResourceMethod() {
    if (!this.props.api.withResource) return
    this.apiToLambdaTargetRestApi.method = this.apiToLambdaTargetRestApi.resource.addMethod(
      'POST',
      this.apiToLambdaTargetRestApi.integration,
      {
        authorizer: this.apiToLambdaTargetRestApi.authoriser,
        methodResponses: [
          this.apiToLambdaTargetRestApi.methodResponse,
          this.apiToLambdaTargetRestApi.methodErrorResponse,
        ],
      }
    )
  }

  /**
   * @summary Method to create custom restApi domain for Api
   */
  protected createApiDomain() {
    if (this.props.api.useExisting) return
    this.apiToLambdaTargetRestApi.domain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.apiSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`,
      this.apiToLambdaTargetRestApi.certificate
    )
  }

  /**
   * @summary Method to create base path mappings for Api
   */
  protected createApiBasePathMapping() {
    if (this.props.api.useExisting) return
    new BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      basePath: '',
      domainName: this.apiToLambdaTargetRestApi.domain,
      restApi: this.apiToLambdaTargetRestApi.api,
      stage: this.apiToLambdaTargetRestApi.api.deploymentStage,
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
      this.apiToLambdaTargetRestApi.domain,
      this.apiToLambdaTargetRestApi.hostedZone,
      this.props.skipStageForARecords
    )
  }
}
