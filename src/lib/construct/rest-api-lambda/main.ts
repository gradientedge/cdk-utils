import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { RestApiLambdaEnvironment, RestApiLambdaProps } from '../../types'

/**
 * @category cdk-utils.rest-api-lambda
 * @subcategory construct
 * @classdesc Provides a construct to create and deploy a RestApi as Lambda
 *
 * <b>Architecture</b><br/> ![Architecture](./RestApiLambda.jpg)
 *
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
 * @mixin
 */
export abstract class RestApiLambda extends CommonConstruct {
  /* restApiLambda props */
  props: RestApiLambdaProps
  id: string

  /* restApiLambda resources */
  applicationSecrets: secretsmanager.ISecret[]
  restApiLambdaPolicy: iam.PolicyDocument
  restApiLambdaRole: iam.Role
  restApiLambdaEnvironment: RestApiLambdaEnvironment
  restApiLambdaLayers: lambda.LayerVersion[] = []
  restApiLambdaFunction: lambda.Function
  restApi: apig.RestApi
  restApiHostedZone: route53.IHostedZone
  restApiCertificate: acm.ICertificate
  restApiDomain: apig.DomainName
  restApiBasePathMappings: apig.BasePathMapping[] = []

  protected constructor(parent: Construct, id: string, props: RestApiLambdaProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   * @protected
   */
  protected initResources() {
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
    this.createRestApiDeployment()
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
    this.restApiHostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
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
   * @protected
   */
  protected createLambdaPolicy() {
    this.restApiLambdaPolicy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream()],
    })
  }

  /**
   * @summary Method to create iam role for RestApi Lambda function
   * @protected
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
   * @protected
   */
  protected createLambdaEnvironment() {
    this.restApiLambdaEnvironment = {
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create layers for RestApi Lambda function
   * @protected
   */
  protected createLambdaLayers() {
    const layers: lambda.LayerVersion[] = []

    if (!this.props.restApiLambdaLayerSources) return

    this.props.restApiLambdaLayerSources.forEach((source: lambda.AssetCode, index: number) => {
      layers.push(this.lambdaManager.createLambdaLayer(`${this.id}-layer-${index}`, this, source))
    })

    this.restApiLambdaLayers = layers
  }

  /**
   * @summary Method to create lambda function for RestApi
   * @protected
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
   * @protected
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
   * @protected
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
   * @protected
   */
  protected createApiBasePathMapping() {
    const apiRootPaths = this.props.apiRootPaths
    if (apiRootPaths && apiRootPaths.length > 0) {
      apiRootPaths.forEach((apiRootPath: string) => {
        this.restApiBasePathMappings.push(
          new apig.BasePathMapping(this, `${this.id}-base-bath-mapping-${apiRootPath}`, {
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
    new apig.BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      domainName: this.restApiDomain,
      restApi: this.restApi,
      stage: this.restApi.deploymentStage,
    })
  }

  /**
   * @summary Method to create route53 records for RestApi
   * @protected
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

  /**
   * @summary Method to deploy the changes to the RestApi
   * @protected
   */
  protected createRestApiDeployment() {
    this.apiManager.createApiDeployment(`${this.id}-deployment`, this, this.restApi)
  }
}
