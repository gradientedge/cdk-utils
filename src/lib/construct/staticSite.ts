import { CommonConstruct } from '../common/commonConstruct'
import { StaticSiteProps } from '../types'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import { Construct } from 'constructs'

/**
 * @stability stable
 * @category Constructs
 * @summary Provides a construct to create and deploy a s3 hosted static site
 *
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
 * }
 *
 */
export class StaticSite extends CommonConstruct {
  /* static site properties */
  props: StaticSiteProps
  id: string

  /* static site resources */
  siteHostedZone: route53.IHostedZone
  siteCertificate: certificateManager.ICertificate
  siteARecord: route53.ARecord
  siteARecordAlt: route53.ARecord
  siteBucket: s3.IBucket
  siteDistribution: cloudfront.IDistribution
  siteLogBucket: s3.IBucket
  siteOriginAccessIdentity: cloudfront.OriginAccessIdentity

  /**
   * @summary Constructor to initialise the StaticSite Construct
   * @param {Construct} parent
   * @param {string} id
   * @param {StaticSiteProps} props
   */
  constructor(parent: Construct, id: string, props: StaticSiteProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   * @protected
   */
  protected initResources() {
    this.resolveHostedZone()
    this.resolveCertificate()
    this.createSiteLogBucket()
    this.createSiteBucket()
    this.createSiteOriginAccessIdentity()
    this.createSiteDistribution()
    this.createSiteRouteAssets()
    this.deploySite()
  }

  /**
   * @summary Method to resolve a hosted zone based on domain attributes
   * @protected
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
   * @protected
   */
  protected resolveCertificate() {
    this.siteCertificate = this.acmManager.resolveCertificate(
      `${this.id}-certificate`,
      this,
      this.props.siteCertificate
    )
  }

  /**
   * @summary Method to create a site log bucket
   * @protected
   */
  protected createSiteLogBucket() {
    this.siteLogBucket = this.s3Manager.createS3Bucket(`${this.id}-site-logs`, this, this.props.siteLogBucket)
  }

  /**
   * @summary Method to create a site bucket
   * @protected
   */
  protected createSiteBucket() {
    this.siteBucket = this.s3Manager.createS3Bucket(`${this.id}-site`, this, this.props.siteBucket)
  }

  /**
   * @summary Method to create a site origin access identity
   * @protected
   */
  protected createSiteOriginAccessIdentity() {
    this.siteOriginAccessIdentity = this.cloudFrontManager.createOriginAccessIdentity(
      `${this.id}-oai`,
      this,
      this.siteBucket
    )
  }

  /**
   * @summary Method to create a site cloudfront distribution
   * @protected
   */
  protected createSiteDistribution() {
    this.siteDistribution = this.cloudFrontManager.createCloudFrontDistribution(
      `${this.id}-distribution`,
      this,
      this.props.siteDistribution,
      this.siteBucket,
      this.siteLogBucket,
      this.siteOriginAccessIdentity,
      this.siteCertificate,
      this.props.siteAliases
    )
  }

  /**
   * @summary Method to create route53 records for static site
   * @protected
   */
  protected createSiteRouteAssets() {
    this.siteARecord = this.route53Manager.createCloudFrontTargetARecord(
      `${this.id}-domain-a-record`,
      this,
      this.siteDistribution,
      this.siteHostedZone,
      this.props.siteRecordName
    )

    if (!this.isProductionStage() && this.props.siteCreateAltARecord) {
      this.siteARecordAlt = this.route53Manager.createCloudFrontTargetARecordV2(
        `${this.id}-domain-a-record-alt`,
        this,
        this.siteDistribution,
        this.siteHostedZone,
        this.props.siteRecordName
      )
    }
  }

  /**
   * @summary Method to deploy the static assets into s3 bucket for static site
   * @protected
   */
  protected deploySite() {
    this.s3Manager.doBucketDeployment(
      `${this.id}-deployment`,
      this,
      this.siteBucket,
      this.siteDistribution,
      [this.props.siteSource],
      '',
      true
    )
  }
}
