import { CommonConstruct } from '../common/commonConstruct'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as apig from 'aws-cdk-lib/aws-apigateway'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import { GraphQlApiLambdaEnvironment, GraphQlApiLambdaProps } from '../types'
import { Construct } from 'constructs'

/**
 * @category Constructs
 * @summary Provides a construct to create and deploy a Graphql API as Lambda
 *
 * @example
 * import { GraphQLApiLambda } '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     const site = new GraphQLApiLambda(this, 'my-new-graphql-api', {...})
 * }
 *
 */
export class GraphQLApiLambda extends CommonConstruct {
  /* graphql api props */
  props: GraphQlApiLambdaProps
  id: string

  /* graphql api resources */
  applicationSecrets: secretsmanager.ISecret[]
  graphQLApiHostedZone: route53.IHostedZone
  graphQLApiCertificate: acm.ICertificate
  graphQLApiDomain: apig.DomainName
  graphQLApiBasePathMapping: apig.BasePathMapping
  graphQLApiLambdaPolicy: iam.PolicyDocument
  graphQLApiLambdaRole: iam.Role
  graphQLApiLambdaEnvironment: GraphQlApiLambdaEnvironment
  graphQLApiLambdaLayers: lambda.LayerVersion[] = []
  graphQLApiLambdaFunction: lambda.Function
  graphQLApi: apig.RestApi

  constructor(parent: Construct, id: string, props: GraphQlApiLambdaProps) {
    super(parent, id, props)

    this.props = props
    this.id = id

    this.initResources()
  }

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

  protected resolveSecrets() {
    this.applicationSecrets = []
  }

  protected resolveHostedZone() {
    this.graphQLApiHostedZone = route53.HostedZone.fromLookup(this, `${this.id}-hosted-zone`, {
      domainName: this.fullyQualifiedDomainName,
    })
  }

  protected resolveCertificate() {
    this.graphQLApiCertificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.graphQLApiCertificate
    )
  }

  protected createLambdaPolicy() {
    this.graphQLApiLambdaPolicy = new iam.PolicyDocument({
      statements: [this.iamManager.statementForReadSecrets(this)],
    })
  }

  protected createLambdaRole() {
    this.graphQLApiLambdaRole = this.iamManager.createRoleForLambda(
      `${this.id}-lambda-role`,
      this,
      this.graphQLApiLambdaPolicy
    )
  }

  protected createLambdaEnvironment() {
    this.graphQLApiLambdaEnvironment = {
      NODE_ENV: this.props.nodeEnv,
      LOG_LEVEL: this.props.logLevel,
      TZ: this.props.timezone,
    }
  }

  protected createLambdaLayers() {
    const layers: lambda.LayerVersion[] = []

    if (!this.props.graphqlApiLambdaLayerSources) return

    this.props.graphqlApiLambdaLayerSources.forEach((source: lambda.AssetCode, index: number) => {
      layers.push(this.lambdaManager.createLambdaLayer(`${this.id}-layer-${index}`, this, source))
    })

    this.graphQLApiLambdaLayers = layers
  }

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

  protected createRestApi() {
    this.graphQLApi = this.apiManager.createLambdaRestApi(
      `${this.id}-lambda-rest-api`,
      this,
      this.props.graphqlRestApi,
      this.graphQLApiLambdaFunction
    )
  }

  protected createApiDomain() {
    this.graphQLApiDomain = this.apiManager.createApiDomain(
      `${this.id}-api-domain`,
      this,
      `${this.props.apiSubDomain}.${this.fullyQualifiedDomainName}`,
      this.graphQLApiCertificate
    )
  }

  protected createApiBasePathMapping() {
    this.graphQLApiBasePathMapping = new apig.BasePathMapping(
      this,
      `${this.id}-base-bath-mapping`,
      {
        basePath: this.props.apiRoot,
        domainName: this.graphQLApiDomain,
        restApi: this.graphQLApi,
        stage: this.graphQLApi.deploymentStage,
      }
    )
  }

  protected createApiRouteAssets() {
    this.route53Manager.createApiGatewayARecord(
      `${this.id}-custom-domain-a-record`,
      this,
      this.props.apiSubDomain,
      this.graphQLApiDomain,
      this.graphQLApiHostedZone
    )
  }
}
