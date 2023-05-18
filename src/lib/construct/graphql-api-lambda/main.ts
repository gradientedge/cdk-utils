import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common'
import { GraphQlApiLambdaEnvironment, GraphQlApiLambdaProps } from '../../types'

/**
 * @stability stable
 * @category cdk-utils.graphql-api-lambda
 * @subcategory construct
 * @classdesc Provides a construct to create and deploy a Graphql API as Lambda
 *
 * <b>Architecture</b><br/> ![Architecture](./GraphQLApiLambda.jpg)
 *
 * @example
 * import { GraphQLApiLambda, GraphQlApiLambdaProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends GraphQLApiLambda {
 *   constructor(parent: Construct, id: string, props: GraphQlApiLambdaProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @mixin
 */
export class GraphQLApiLambda extends CommonConstruct {
  /* graphql restApi props */
  props: GraphQlApiLambdaProps
  id: string

  /* graphql restApi resources */
  applicationSecrets: secretsmanager.ISecret[]
  graphQLApiLambdaPolicy: iam.PolicyDocument
  graphQLApiLambdaRole: iam.Role
  graphQLApiLambdaEnvironment: GraphQlApiLambdaEnvironment
  graphQLApiLambdaLayers: lambda.LayerVersion[] = []
  graphQLApiLambdaFunction: lambda.Function
  graphQLApi: apig.RestApi
  graphQLApiHostedZone: route53.IHostedZone
  graphQLApiCertificate: acm.ICertificate
  graphQLApiDomain: apig.DomainName
  graphQLApiBasePathMappings: apig.BasePathMapping[] = []

  constructor(parent: Construct, id: string, props: GraphQlApiLambdaProps) {
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
    this.graphQLApiHostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
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
      this.props.graphQLApiCertificate.useExistingCertificate &&
      this.props.graphQLApiCertificate.certificateSsmName &&
      this.props.graphQLApiCertificate.certificateRegion
    ) {
      this.props.graphQLApiCertificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-certificate-param`,
        this,
        this.props.graphQLApiCertificate.certificateSsmName,
        this.props.graphQLApiCertificate.certificateRegion
      )
    }

    this.graphQLApiCertificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.graphQLApiCertificate
    )
  }

  /**
   * @summary Method to create iam policy for GraphQL Lambda function
   * @protected
   */
  protected createLambdaPolicy() {
    this.graphQLApiLambdaPolicy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForCreateAnyLogStream()],
    })
  }

  /**
   * @summary Method to create iam role for GraphQL Lambda function
   * @protected
   */
  protected createLambdaRole() {
    this.graphQLApiLambdaRole = this.iamManager.createRoleForLambda(
      `${this.id}-lambda-role`,
      this,
      this.graphQLApiLambdaPolicy
    )
  }

  /**
   * @summary Method to create environment variables for GraphQL Lambda function
   * @protected
   */
  protected createLambdaEnvironment() {
    this.graphQLApiLambdaEnvironment = {
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
    }
  }

  /**
   * @summary Method to create layers for GraphQL Lambda function
   * @protected
   */
  protected createLambdaLayers() {
    const layers: lambda.LayerVersion[] = []

    if (!this.props.graphqlApiLambdaLayerSources) return

    this.props.graphqlApiLambdaLayerSources.forEach((source: lambda.AssetCode, index: number) => {
      layers.push(this.lambdaManager.createLambdaLayer(`${this.id}-layer-${index}`, this, source))
    })

    this.graphQLApiLambdaLayers = layers
  }

  /**
   * @summary Method to create lambda function for GraphQL
   * @protected
   */
  protected createLambdaFunction() {
    this.graphQLApiLambdaFunction = this.lambdaManager.createLambdaFunction(
      `${this.id}-graphql-server`,
      this,
      this.props.graphqlApi,
      this.graphQLApiLambdaRole,
      this.graphQLApiLambdaLayers,
      this.props.graphQLApiSource,
      this.props.graphQLApiHandler || 'index.handler',
      this.graphQLApiLambdaEnvironment
    )
  }

  /**
   * @summary Method to create rest restApi for GraphQL
   * @protected
   */
  protected createRestApi() {
    this.graphQLApi = this.apiManager.createLambdaRestApi(
      `${this.id}-lambda-rest-api`,
      this,
      this.props.graphqlRestApi,
      this.graphQLApiLambdaFunction
    )
  }

  /**
   * @summary Method to create custom restApi domain for GraphQL API
   * @protected
   */
  protected createApiDomain() {
    this.graphQLApiDomain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.apiSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`,
      this.graphQLApiCertificate
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
        this.graphQLApiBasePathMappings.push(
          new apig.BasePathMapping(this, `${this.id}-base-bath-mapping-${apiRootPath}`, {
            basePath: apiRootPath,
            domainName: this.graphQLApiDomain,
            restApi: this.graphQLApi,
            stage: this.graphQLApi.deploymentStage,
          })
        )
      })
      return
    }

    // add default mapping if apiRootPaths not set
    new apig.BasePathMapping(this, `${this.id}-base-bath-mapping`, {
      domainName: this.graphQLApiDomain,
      restApi: this.graphQLApi,
      stage: this.graphQLApi.deploymentStage,
    })
  }

  /**
   * @summary Method to create route53 records for GraphQL API
   * @protected
   */
  protected createApiRouteAssets() {
    this.route53Manager.createApiGatewayARecord(
      `${this.id}-custom-domain-a-record`,
      this,
      this.props.apiSubDomain,
      this.graphQLApiDomain,
      this.graphQLApiHostedZone,
      this.props.skipStageForARecords
    )
  }
}
