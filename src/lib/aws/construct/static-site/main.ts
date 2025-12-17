import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import {
  FunctionAssociation,
  FunctionEventType,
  IDistribution,
  IFunction,
  OriginAccessIdentity,
} from 'aws-cdk-lib/aws-cloudfront'
import { ARecord, IHostedZone } from 'aws-cdk-lib/aws-route53'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'
import { CommonConstruct } from '../../common/index.js'
import { StaticSiteProps } from './types.js'

/**
 * @classdesc Provides a construct to create and deploy a s3 hosted static site
 * @example
 * import { StaticSite, StaticSiteProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends StaticSite {
 *   constructor(parent: Construct, id: string, props: StaticSiteProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class StaticSite extends CommonConstruct {
  /* static site properties */
  props: StaticSiteProps
  id: string

  /* static site resources */
  siteHostedZone: IHostedZone
  siteCertificate: ICertificate
  siteARecord: ARecord
  siteBucket: IBucket
  siteDistribution: IDistribution
  siteLogBucket: IBucket
  siteOriginAccessIdentity: OriginAccessIdentity
  siteCloudfrontFunction: IFunction
  siteFunctionAssociations: FunctionAssociation[]

  constructor(parent: Construct, id: string, props: StaticSiteProps) {
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
    this.createSiteLogBucket()
    this.createSiteBucket()
    this.createSiteCloudfrontFunction()
    this.resolveSiteFunctionAssociations()
    this.createSiteOriginAccessIdentity()
    this.createSiteDistribution()
    this.createSiteRouteAssets()
    this.deploySite()
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
    if (
      this.props.siteCertificate.useExistingCertificate &&
      this.props.siteCertificate.certificateSsmName &&
      this.props.siteCertificate.certificateRegion
    ) {
      this.props.siteCertificate.certificateArn = this.ssmManager.readStringParameterFromRegion(
        `${this.id}-certificate-param`,
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

  /**
   * @summary Method to create a site log bucket
   */
  protected createSiteLogBucket() {
    this.siteLogBucket = this.s3Manager.createS3Bucket(`${this.id}-site-logs`, this, this.props.siteLogBucket)
  }

  /**
   * @summary Method to create a site bucket
   */
  protected createSiteBucket() {
    this.siteBucket = this.s3Manager.createS3Bucket(`${this.id}-site`, this, this.props.siteBucket)
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
   * @summary Method to create a site origin access identity
   */
  protected createSiteOriginAccessIdentity() {}

  /**
   * @summary Method to create a site cloudfront distribution
   */
  protected createSiteDistribution() {
    if (!this.props.siteDistribution) throw 'SiteDistribution props undefined'

    this.siteDistribution = this.cloudFrontManager.createDistributionWithS3Origin(
      `${this.id}-distribution`,
      this,
      this.props.siteDistribution,
      this.siteBucket,
      this.siteLogBucket,
      this.siteOriginAccessIdentity,
      this.siteCertificate,
      this.props.siteAliases,
      this.siteFunctionAssociations
    )
  }

  /**
   * @summary Method to create route53 records for static site
   */
  protected createSiteRouteAssets() {
    this.siteARecord = this.route53Manager.createCloudFrontTargetARecord(
      `${this.id}-domain-a-record`,
      this,
      this.siteDistribution,
      this.siteHostedZone,
      this.props.siteRecordName,
      this.props.skipStageForARecords
    )
  }

  /**
   * @summary Method to deploy the static assets into s3 bucket for static site
   */
  protected deploySite() {
    const prune = this.props.pruneOnDeployment ?? true
    this.s3Manager.doBucketDeployment(
      `${this.id}-deployment`,
      this,
      this.siteBucket,
      this.siteDistribution,
      [this.props.siteSource],
      '',
      prune
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
