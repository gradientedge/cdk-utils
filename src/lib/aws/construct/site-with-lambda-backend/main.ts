import { Duration, Fn } from 'aws-cdk-lib'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
  CachePolicy,
  IFunction as CfIFunction,
  Distribution,
  FunctionAssociation,
  FunctionEventType,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { AnyPrincipal, Effect, PolicyDocument, PolicyStatement, Role } from 'aws-cdk-lib/aws-iam'
import { AssetCode, Function, FunctionUrl, FunctionUrlAuthType, IFunction, ILayerVersion } from 'aws-cdk-lib/aws-lambda'
import { IHostedZone } from 'aws-cdk-lib/aws-route53'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment } from 'aws-cdk-lib/aws-s3-deployment'
import { Construct } from 'constructs'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { LAMBDA_ALIAS_NAME_CURRENT } from './constants'
import {
  SiteWithLambdaBackendCachePolicyProps,
  SiteWithLambdaBackendProps,
  SiteWithLambdaBackendResponseHeadersPolicyProps,
} from './types'

/**
 * @classdesc Provides a construct to create and deploy a site hosted with an clustered ECS/ELB backend
 * @example
 * import { SiteWithLambdaBackend, SiteWithLambdaBackendProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends SiteWithLambdaBackend {
 *   constructor(parent: Construct, id: string, props: SiteWithLambdaBackendProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class SiteWithLambdaBackend extends CommonConstruct {
  /* site properties */
  props: SiteWithLambdaBackendProps
  id: string

  /* site resources */
  siteHostedZone: IHostedZone
  siteCertificate: ICertificate
  siteRegionalCertificate: ICertificate
  siteSecrets: any
  siteLogBucket: IBucket
  siteOrigin: HttpOrigin
  siteDistribution: Distribution
  siteInternalDomainName: string
  siteExternalDomainName: string
  siteDomainNames: string[]
  siteCloudfrontFunction: CfIFunction
  siteFunctionAssociations: FunctionAssociation[]
  siteOriginRequestPolicy: OriginRequestPolicy
  siteOriginResponseHeadersPolicy?: ResponseHeadersPolicy
  siteCachePolicy: CachePolicy
  siteStaticAssetDeployment: BucketDeployment
  siteLambdaPolicy: PolicyDocument
  siteLambdaRole: Role
  siteLambdaEnvironment: any
  siteLambdaLayers: ILayerVersion[]
  siteLambdaApplication: AssetCode
  siteLambdaFunction: IFunction
  siteLambdaUrl: FunctionUrl

  constructor(parent: Construct, id: string, props: SiteWithLambdaBackendProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.resolveHostedZone()
    this.resolveCertificate()
    this.resolveSiteSecrets()
    this.resolveSiteDomainNames()
    this.createSiteLogBucket()
    this.createSiteOriginCachePolicy()
    this.createSiteOriginRequestPolicy()
    this.createSiteOriginResponseHeadersPolicy()
    this.createSiteOrigin()
    this.createSiteCloudfrontFunction()
    this.resolveSiteFunctionAssociations()
    this.createDistribution()
    this.createNetworkMappings()
    this.invalidateDistributionCache()
  }

  /**
   * @summary Method to resolve a hosted zone based on domain attributes
   */
  protected resolveHostedZone() {
    this.siteHostedZone = this.route53Manager.withHostedZoneFromFullyQualifiedDomainName(
      `${this.id}-hosted-zone`,
      this,
      this.props.useExistingHostedZone
    )
  }

  /**
   * @summary Method to resolve a certificate based on attributes
   */
  protected resolveCertificate() {
    this.resolveGlobalCertificate()
    this.resolveRegionalCertificate()
  }

  protected resolveGlobalCertificate() {
    if (
      this.props.siteCertificate.useExistingCertificate &&
      this.props.siteCertificate.certificateSsmName &&
      this.props.siteCertificate.certificateRegion
    ) {
      this.props.siteCertificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-certificate-parameter`,
        this,
        this.props.siteCertificate.certificateSsmName,
        this.props.siteCertificate.certificateRegion
      )
    }
    this.siteCertificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.siteCertificate
    )
  }

  protected resolveRegionalCertificate() {
    if (
      this.props.siteRegionalCertificate.useExistingCertificate &&
      this.props.siteRegionalCertificate.certificateSsmName &&
      this.props.siteRegionalCertificate.certificateRegion
    ) {
      this.props.siteRegionalCertificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-regional-certificate-parameter`,
        this,
        this.props.siteRegionalCertificate.certificateSsmName,
        this.props.siteRegionalCertificate.certificateRegion
      )
    }
    this.siteRegionalCertificate = this.acmManager.resolveCertificate(
      `${this.id}-regional-certificate`,
      this,
      this.props.siteRegionalCertificate,
      this.siteHostedZone
    )
  }

  /**
   * @summary Method to resolve secrets from SecretsManager
   * - To be implemented in the overriding method in the implementation class
   */
  protected resolveSiteSecrets() {}

  /**
   * @summary Method to resolve site domain names
   */
  protected resolveSiteDomainNames() {
    /* the internal domain name used by ELB */
    this.siteInternalDomainName =
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.siteSubDomain}-internal.${this.fullyQualifiedDomainName}`
        : `${this.props.siteSubDomain}-internal-${this.props.stage}.${this.fullyQualifiedDomainName}`

    /* the external domain name exposed to CloudFront */
    this.siteExternalDomainName =
      this.isProductionStage() || this.props.skipStageForARecords
        ? `${this.props.siteSubDomain}.${this.fullyQualifiedDomainName}`
        : `${this.props.siteSubDomain}-${this.props.stage}.${this.fullyQualifiedDomainName}`

    this.siteDomainNames = [this.siteExternalDomainName]
  }

  /**
   * Method to create log bucket for site distribution
   */
  protected createSiteLogBucket() {
    this.siteLogBucket = this.s3Manager.createS3Bucket(`${this.id}-site-logs`, this, this.props.siteLogBucket)
  }

  protected createSiteCachePolicy(id: string, siteCachePolicy: SiteWithLambdaBackendCachePolicyProps) {
    if (!siteCachePolicy.cachePolicyName) throw `SiteCachePolicy cachePolicyName undefined for ${id}`

    return new CachePolicy(this, `${id}`, {
      cachePolicyName: this.resourceNameFormatter.format(siteCachePolicy.cachePolicyName),
      comment: `Policy for ${this.id}-distribution - ${this.props.stage} stage`,
      cookieBehavior: siteCachePolicy.cookieBehavior,
      enableAcceptEncodingBrotli: siteCachePolicy.enableAcceptEncodingBrotli,
      enableAcceptEncodingGzip: siteCachePolicy.enableAcceptEncodingGzip,
      headerBehavior: siteCachePolicy.headerBehavior,
      maxTtl: Duration.seconds(siteCachePolicy.maxTtlInSeconds),
      minTtl: Duration.seconds(siteCachePolicy.minTtlInSeconds),
      queryStringBehavior: siteCachePolicy.queryStringBehavior,
    })
  }

  protected createSiteOriginCachePolicy() {
    if (!this.props.siteCachePolicy) return
    this.siteCachePolicy = this.createSiteCachePolicy(`${this.id}-site-cache-policy`, this.props.siteCachePolicy)
    _.assign(this.props.siteDistribution.defaultBehavior, {
      cachePolicy: this.siteCachePolicy,
    })
  }

  protected createSiteOriginRequestPolicy() {
    if (!this.props.siteOriginRequestPolicy) return
    if (!this.props.siteOriginRequestPolicy.originRequestPolicyName)
      throw `SiteOriginRequestPolicy originRequestPolicyName undefined for ${this.id}`

    this.siteOriginRequestPolicy = new OriginRequestPolicy(this, `${this.id}-sorp`, {
      comment: `Request Policy for ${this.id}-distribution - ${this.props.stage} stage`,
      cookieBehavior: this.props.siteOriginRequestPolicy.cookieBehavior,
      headerBehavior: this.props.siteOriginRequestPolicy.headerBehavior,
      originRequestPolicyName: this.resourceNameFormatter.format(
        this.props.siteOriginRequestPolicy.originRequestPolicyName
      ),
      queryStringBehavior: this.props.siteOriginRequestPolicy.queryStringBehavior,
    })

    _.assign(this.props.siteDistribution.defaultBehavior, {
      originRequestPolicy: this.siteOriginRequestPolicy,
    })
  }

  protected createResponseHeaderPolicy(props: SiteWithLambdaBackendResponseHeadersPolicyProps) {
    if (!props) return undefined
    if (!props.responseHeadersPolicyName)
      throw `SiteResponseHeadersPolicy responseHeadersPolicyName undefined for ${this.id}`

    return new ResponseHeadersPolicy(this, `${this.id}-${props.type}-srhp`, {
      ...props,
      comment: `Response Header Policy for ${props.type} for ${this.id}-distribution - ${this.props.stage} stage`,
      responseHeadersPolicyName: this.resourceNameFormatter.format(props.responseHeadersPolicyName),
      securityHeadersBehavior: {
        ...props.securityHeadersBehavior,
        strictTransportSecurity: {
          ...props.securityHeadersBehavior?.strictTransportSecurity,
          accessControlMaxAge: Duration.seconds(
            props.securityHeadersBehavior?.strictTransportSecurity?.accessControlMaxAgeInSeconds
          ),
        },
      },
    })
  }

  protected createSiteOriginResponseHeadersPolicy() {
    if (!this.props.siteOriginResponseHeadersPolicy) return
    this.siteOriginResponseHeadersPolicy = this.createResponseHeaderPolicy(this.props.siteOriginResponseHeadersPolicy)
    _.assign(this.props.siteDistribution.defaultBehavior, {
      responseHeadersPolicy: this.siteOriginResponseHeadersPolicy,
    })
  }

  protected createSiteOrigin() {
    this.createSiteOriginResources()
    this.siteOrigin = new HttpOrigin(Fn.select(2, Fn.split('/', this.siteLambdaUrl.url)), {
      httpPort: 443,
      originId: `${this.id}-server`,
      protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
    })
  }

  protected createSiteOriginResources() {
    this.createSiteStaticAssetDeployment()
    this.createSiteLambdaPolicy()
    this.createSiteLambdaRole()
    this.createSiteLambdaEnvironment()
    this.createSiteLambdaLayers()
    this.createSiteLambdaApplication()
    this.createSiteLambda()
    this.createSiteLambdaUrl()
  }

  protected createSiteStaticAssetDeployment() {}

  protected createSiteLambdaPolicy() {
    this.siteLambdaPolicy = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['lambda:InvokeFunctionUrl'],
          effect: Effect.ALLOW,
          resources: ['*'],
        }),
      ],
    })
  }

  protected createSiteLambdaRole() {
    this.siteLambdaRole = this.iamManager.createRoleForLambda(`${this.id}-role`, this, this.siteLambdaPolicy)
  }

  protected createSiteLambdaEnvironment() {
    this.siteLambdaEnvironment = {
      AWS_LAMBDA_EXEC_WRAPPER: this.props.siteExecWrapperPath ?? '/opt/bootstrap',
      LOG_LEVEL: this.props.logLevel,
      NODE_ENV: this.props.nodeEnv,
      PORT: this.props.sitePort,
      READINESS_CHECK_PATH: this.props.siteHealthEndpoint,
      READINESS_CHECK_PORT: this.props.sitePort,
      STAGE: this.props.stage,
      TZ: this.props.timezone,
    }
  }

  protected createSiteLambdaLayers() {
    this.siteLambdaLayers = this.lambdaManager.createWebAdapterLayer(`${this.id}-web-adapter`, this)
  }

  protected createSiteLambdaApplication() {}

  protected createSiteLambda() {
    this.siteLambdaFunction = this.lambdaManager.createLambdaFunction(
      `${this.id}-lambda`,
      this,
      this.props.siteLambda,
      this.siteLambdaRole,
      this.siteLambdaLayers,
      this.siteLambdaApplication,
      this.props.siteLambda.handler,
      this.siteLambdaEnvironment
    )
  }

  protected createSiteLambdaUrl() {
    const lambdaAlias = _.find(
      this.props.siteLambda.lambdaAliases,
      alias => alias.aliasName === LAMBDA_ALIAS_NAME_CURRENT
    )

    const lambdaFn = lambdaAlias
      ? Function.fromFunctionAttributes(this, `${this.id}-fn-alias`, {
          functionArn: `${this.siteLambdaFunction.functionArn}:${lambdaAlias.aliasName}`,
          sameEnvironment: true,
        })
      : this.siteLambdaFunction
    lambdaFn.node.addDependency(this.siteLambdaFunction)

    this.siteLambdaUrl = lambdaFn.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
    })
    this.siteLambdaUrl.node.addDependency(this.siteLambdaFunction)
    this.siteLambdaUrl.node.addDependency(lambdaFn)

    const principal = new AnyPrincipal()
    principal.addToPolicy(
      new PolicyStatement({
        actions: ['lambda:InvokeFunctionUrl'],
        conditions: { StringEquals: { 'lambda:FunctionUrlAuthType': FunctionUrlAuthType.NONE } },
        effect: Effect.ALLOW,
        resources: ['*'],
      })
    )

    lambdaFn.grantInvokeUrl({ grantPrincipal: principal })

    this.addCfnOutput(`${this.id}-url`, this.siteLambdaUrl.url)
  }

  /**
   * @summary Method to create a site cloudfront function
   */
  protected createSiteCloudfrontFunction() {
    if (this.props.siteCloudfrontFunctionProps) {
      this.siteCloudfrontFunction = this.cloudFrontManager.createCloudfrontFunction(
        `${this.id}-function`,
        this,
        this.props.siteCloudfrontFunctionProps
      )
    }
  }

  /**
   * @summary Method to create a site cloudfront function associations
   */
  protected resolveSiteFunctionAssociations() {
    if (this.props.siteCloudfrontFunctionProps) {
      this.siteFunctionAssociations = [
        {
          eventType: FunctionEventType.VIEWER_REQUEST,
          function: this.siteCloudfrontFunction,
        },
      ]
    }
  }

  /**
   * Method to create Site distribution
   */
  protected createDistribution() {
    this.siteDistribution = this.cloudFrontManager.createDistributionWithHttpOrigin(
      `${this.id}-distribution`,
      this,
      this.props.siteDistribution,
      this.siteOrigin,
      this.siteDomainNames,
      this.siteLogBucket,
      this.siteCertificate,
      this.siteFunctionAssociations,
      this.props.siteDistribution.defaultBehavior.responseHeadersPolicy
    )
    this.siteDistribution.node.addDependency(this.siteLambdaFunction)
    this.siteDistribution.node.addDependency(this.siteLambdaUrl)
  }

  /**
   * Method to create Route53 records for distribution
   */
  protected createNetworkMappings() {
    this.route53Manager.createCloudFrontTargetARecord(
      `${this.id}-a-record`,
      this,
      this.siteDistribution,
      this.siteHostedZone,
      this.props.siteRecordName,
      this.props.skipStageForARecords
    )
  }

  /**
   * Method to invalidation the cloudfront distribution cache after a deployment
   */
  protected invalidateDistributionCache() {
    if (this.props.siteCacheInvalidationDockerFilePath) {
      this.cloudFrontManager.invalidateCache(
        `${this.id}-cache-invalidation`,
        this,
        this.props.siteCacheInvalidationDockerFilePath,
        this.siteDistribution.distributionId
      )
    }
  }
}
