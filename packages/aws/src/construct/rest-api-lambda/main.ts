import { BasePathMapping, DomainName, RestApi } from 'aws-cdk-lib/aws-apigateway'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { PolicyDocument, Role } from 'aws-cdk-lib/aws-iam'
import { AssetCode, IFunction, ILayerVersion, LayerVersion } from 'aws-cdk-lib/aws-lambda'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import _ from 'lodash'
import { CommonConstruct } from '../../common/index.js'
import { RestApiLambdaEnvironment, RestApiLambdaProps } from './types.js'

/**
 * @classdesc Provides a construct to create and deploy a RestApi as Lambda
 *
 * <b>Architecture</b><br/> ![Architecture](./RestApiLambda.jpg)
 * @example
 * import { RestApiLambda, RestApiLambdaProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends RestApiLambda {
 *   constructor(parent: Construct, id: string, props: RestApiLambdaProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export abstract class RestApiLambda extends CommonConstruct {
  /* restApiLambda props */
  props: RestApiLambdaProps
  id: string

  /* restApiLambda resources */
  applicationSecrets: ISecret[]
  restApiLambdaPolicy: PolicyDocument
  restApiLambdaRole: Role
  restApiLambdaEnvironment: RestApiLambdaEnvironment
  restApiLambdaLayers: ILayerVersion[] = []
  restApiLambdaFunction: IFunction
  restApi: RestApi
  restApiHostedZone: IHostedZone
  restApiCertificate: ICertificate
  restApiDomain: DomainName
  restApiBasePathMappings: BasePathMapping[] = []

  protected constructor(parent: Construct, id: string, props: RestApiLambdaProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.resolveSecrets()
    this.resolveHostedZone()
    this.resolveCertificate()
    this.createLambdaPolicy()
    this.createLambdaRole()
    this.createLambdaEnvironment()
    this.createLambdaLayers()
    this.createLambdaFunction()
    this.createRestApi()
    this.createRestApiResources()
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
    this.restApiHostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
      `${this.id}-hosted-zone`,
      this,
      this.props.useExistingHostedZone
    )
  }

  /**
   * @summary Method to resolve a certificate based on attributes
   */
  protected resolveCertificate() {
    if (
      this.props.restApiCertificate.useExistingCertificate &&
      this.props.restApiCertificate.certificateSsmName &&
      this.props.restApiCertificate.certificateRegion
    ) {
      this.props.restApiCertificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-certificate-param`,
        this,
        this.props.restApiCertificate.certificateSsmName,
        this.props.restApiCertificate.certificateRegion
      )
    }

    this.restApiCertificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.restApiCertificate
    )
  }

  /**
   * @summary Method to create iam policy for RestApi Lambda function
   */
  protected createLambdaPolicy() {
    this.restApiLambdaPolicy = new PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream()],
    })
  }

  /**
   * @summary Method to create iam role for RestApi Lambda function
   */
  protected createLambdaRole() {
    this.restApiLambdaRole = this.iamManager.createRoleForLambda(
      `${this.id}-lambda-role`,
      this,
      this.restApiLambdaPolicy
    )
  }

  /**
   * @summary Method to create environment variables for RestApi Lambda function
   */
  protected createLambdaEnvironment() {
    this.restApiLambdaEnvironment = {
      LOG_LEVEL: this.props.logLevel,
      NODE_ENV: this.props.nodeEnv,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create layers for RestApi Lambda function
   */
  protected createLambdaLayers() {
    const layers: LayerVersion[] = []

    if (!this.props.restApiLambdaLayerSources) return

    _.forEach(this.props.restApiLambdaLayerSources, (source: AssetCode, index: number) => {
      layers.push(this.lambdaManager.createLambdaLayer(`${this.id}-layer-${index}`, this, source))
    })

    this.restApiLambdaLayers = layers
  }

  /**
   * @summary Method to create lambda function for RestApi
   */
  protected createLambdaFunction() {
    this.restApiLambdaFunction = this.lambdaManager.createLambdaFunction(
      `${this.id}-restapi-server`,
      this,
      this.props.restApiLambda,
      this.restApiLambdaRole,
      this.restApiLambdaLayers,
      this.props.restApiSource,
      this.props.restApiHandler || 'index.handler',
      this.restApiLambdaEnvironment
    )
  }

  /**
   * @summary Method to create rest restApiLambda for RestApi
   */
  protected createRestApi() {
    this.restApi = this.apiManager.createLambdaRestApi(
      `${this.id}-lambda-rest-api`,
      this,
      this.props.restApi,
      this.restApiLambdaFunction
    )
  }

  protected abstract createRestApiResources(): void

  /**
   * @summary Method to create custom restApiLambda domain for RestApi
   */
  protected createApiDomain() {
    this.restApiDomain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.apiSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`,
      this.restApiCertificate
    )
  }

  /**
   * @summary Method to create base path mappings for RestApi
   */
  protected createApiBasePathMapping() {
    const apiRootPaths = this.props.apiRootPaths
    if (apiRootPaths && !_.isEmpty(apiRootPaths)) {
      _.forEach(apiRootPaths, (apiRootPath: string) => {
        this.restApiBasePathMappings.push(
          new BasePathMapping(this, `${this.id}-base-bath-mapping-${apiRootPath}`, {
            basePath: apiRootPath,
            domainName: this.restApiDomain,
            restApi: this.restApi,
            stage: this.restApi.deploymentStage,
          })
        )
      })
      return
    }

    // add default mapping if apiRootPaths not set
    new BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      domainName: this.restApiDomain,
      restApi: this.restApi,
      stage: this.restApi.deploymentStage,
    })
  }

  /**
   * @summary Method to create route53 records for RestApi
   */
  protected createApiRouteAssets() {
    this.route53Manager.createApiGatewayARecord(
      `${this.id}-custom-domain-a-record`,
      this,
      this.props.apiSubDomain,
      this.restApiDomain,
      this.restApiHostedZone,
      this.props.skipStageForARecords
    )
  }
}
