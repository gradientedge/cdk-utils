import * as cdk from 'aws-cdk-lib'
import * as apig from 'aws-cdk-lib/aws-apigateway'
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
    this.createApiToLambdaTargetRestApi()
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
        deployOptions: {
          accessLogDestination: new apig.LogGroupLogDestination(accessLogGroup),
        },
      },
    }

    this.apiToLambdaTargetRestApi.api = this.apiManager.createLambdaRestApi(
      `${this.id}-lambda-rest-api`,
      this,
      this.props.api.restApi,
      lambda.Function.fromFunctionName(this, `${this.id}-lambda`, this.props.lambdaFunctionName)
    )

    this.addCfnOutput(`${this.id}-restApiId`, this.apiToLambdaTargetRestApi.api.restApiId)
    this.addCfnOutput(`${this.id}-restApiRootResourceId`, this.apiToLambdaTargetRestApi.api.root.resourceId)
  }

  /**
   * @summary Method to create custom restApi domain for Api API
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
   * @summary Method to create base path mappings for GraphQL API
   * @protected
   */
  protected createApiBasePathMapping() {
    const apiRootPaths = this.props.apiRootPaths
    if (apiRootPaths && apiRootPaths.length > 0) {
      apiRootPaths.forEach((apiRootPath: string) => {
        this.apiToLambdaTargetRestApi.basePathMappings.push(
          new apig.BasePathMapping(this, `${this.id}-base-bath-mapping-${apiRootPath}`, {
            basePath: apiRootPath,
            domainName: this.apiToLambdaTargetRestApi.domain,
            restApi: this.apiToLambdaTargetRestApi.api,
            stage: this.apiToLambdaTargetRestApi.api.deploymentStage,
          })
        )
      })
      return
    }

    // add default mapping if apiRootPaths not set
    new apig.BasePathMapping(this, `${this.id}-base-bath-mapping`, {
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
