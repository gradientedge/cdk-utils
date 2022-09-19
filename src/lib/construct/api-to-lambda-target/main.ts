import * as cdk from 'aws-cdk-lib'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import * as helper from '../../helper'
import * as types from '../../types/aws'

export class ApiToLambdaTarget extends CommonConstruct {
  props: types.ApiToLambdaTargetProps
  id: string

  /* application related resources */
  applicationSecrets: secretsmanager.ISecret[]

  /* rest restApi related resources */
  apiToLambdaTargetRestApi: types.ApiToLambdaTargetRestApiType
  apiResource: string

  constructor(parent: Construct, id: string, props: types.ApiToLambdaTargetProps) {
    super(parent, id, props)

    this.props = props
    this.id = id

    this.apiToLambdaTargetRestApi = new helper.ApiToLambdaTargetRestApi()
  }

  protected initResources() {
    /* application related resources */
    this.resolveSecrets()

    /* core resources */
    this.resolveHostedZone()
    this.resolveCertificate()

    /* restApi related resources */
    this.createApiToLambdaTargetMethodResponse()
    this.createApiToLambdaTargetMethodErrorResponse()
    this.resolveApiToLambdaTargetFunction()
    this.createApiToLambdaTargetRestApi()
    this.createApiToLambdaTargetResource()
    this.createApiToLambdaTargetIntegration()
    this.createApiToLambdaTargetResourceMethod()
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
    this.apiToLambdaTargetRestApi.hostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
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
   * @protected
   */
  protected createApiToLambdaTargetMethodResponse() {
    if (!this.props.api.withResource) return
    this.apiToLambdaTargetRestApi.methodResponse = {
      ...{
        statusCode: '200',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      ...this.props.api.methodResponse,
    }
  }

  /**
   * @summary Method to create api integration method error response
   * @protected
   */
  protected createApiToLambdaTargetMethodErrorResponse() {
    if (!this.props.api.withResource) return
    this.apiToLambdaTargetRestApi.methodErrorResponse = {
      ...{
        statusCode: '400',
        responseParameters: {
          'method.response.header.Content-Type': true,
          'method.response.header.Access-Control-Allow-Origin': true,
          'method.response.header.Access-Control-Allow-Credentials': true,
        },
      },
      ...this.props.api.methodErrorResponse,
    }
  }

  protected resolveApiToLambdaTargetFunction() {
    this.apiToLambdaTargetRestApi.lambda = lambda.Function.fromFunctionName(
      this,
      `${this.id}-lambda`,
      this.props.lambdaFunctionName
    )
  }

  /**
   * @summary Method to create rest restApi for Api
   * @protected
   */
  protected createApiToLambdaTargetRestApi() {
    if (this.props.api.useExisting && this.props.api.importedRestApiRef) {
      this.apiToLambdaTargetRestApi.api = apig.RestApi.fromRestApiId(
        this,
        `${this.id}-rest-api`,
        cdk.Fn.importValue(this.props.api.importedRestApiRef)
      )
      return
    }

    const accessLogGroup = this.logManager.createLogGroup(`${this.id}-rest-api-access-log`, this, {
      logGroupName: `/custom/api/${this.id}-rest-api-access`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    this.props.api.restApi = {
      ...this.props.api.restApi,
      ...{
        defaultMethodOptions: {
          methodResponses: [
            this.apiToLambdaTargetRestApi.methodResponse,
            this.apiToLambdaTargetRestApi.methodErrorResponse,
          ],
        },
        deployOptions: {
          accessLogDestination: new apig.LogGroupLogDestination(accessLogGroup),
        },
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
   * @protected
   */
  protected createApiToLambdaTargetResource() {
    if (!this.props.api.withResource) return

    let rootResource
    if (this.props.api.withResource && this.props.api.importedRestApiRootResourceRef) {
      rootResource = apig.Resource.fromResourceAttributes(this, `${this.id}-root-resource`, {
        resourceId: cdk.Fn.importValue(this.props.api.importedRestApiRootResourceRef),
        restApi: this.apiToLambdaTargetRestApi.api,
        path: '/',
      })
    } else {
      rootResource = this.apiToLambdaTargetRestApi.api.root
    }

    this.apiToLambdaTargetRestApi.resource = rootResource.addResource(this.props.api.resource ?? this.apiResource)
  }

  /**
   * @summary Method to create api integration resource method
   * @protected
   */
  protected createApiToLambdaTargetIntegration() {
    this.apiToLambdaTargetRestApi.integration = new apig.LambdaIntegration(this.apiToLambdaTargetRestApi.lambda)
    this.apiToLambdaTargetRestApi.lambda.addPermission(`${this.id}-perms`, {
      principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      sourceArn: this.apiToLambdaTargetRestApi.api.arnForExecuteApi('*'),
    })
  }

  /**
   * @summary Method to create api integration resource method
   * @protected
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
   * @protected
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
   * @protected
   */
  protected createApiBasePathMapping() {
    if (this.props.api.useExisting) return
    new apig.BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      basePath: '',
      domainName: this.apiToLambdaTargetRestApi.domain,
      restApi: this.apiToLambdaTargetRestApi.api,
      stage: this.apiToLambdaTargetRestApi.api.deploymentStage,
    })
  }

  /**
   * @summary Method to create route53 records for Api
   * @protected
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
