import { CommonConstruct } from '../common/commonConstruct'
import { StaticSiteProps } from '../types'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as certificateManager from 'aws-cdk-lib/aws-certificatemanager'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import { Construct } from 'constructs'

/**
 * @category Constructs
 * @summary Provides a construct to create and deploy a s3 hosted static site
 *
 * @example
 * import { StaticSite } '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     const site = new StaticSite(this, 'my-new-static-site', {...})
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

  constructor(parent: Construct, id: string, props: StaticSiteProps) {
    super(parent, id, props)

    this.props = props
    this.id = id
  }

  protected initResources() {
    this.initHostedZone()
    this.initCertificate()
    this.createSiteBucket()
    this.createSiteLogBucket()
    this.createSiteOriginAccessIdentity()
    this.createSiteDistribution()
    this.createSiteRouteAssets()
    this.deploySite()
  }

  protected initHostedZone() {
    this.siteHostedZone = route53.HostedZone.fromLookup(this, `${this.id}-hosted-zone`, {
      domainName: this.props.siteHostedZoneDomainName || this.fullyQualifiedDomainName,
    })
  }

  protected initCertificate() {
    this.siteCertificate = this.acmManager.resolveCertificate(
      this.id,
      this,
      this.props.siteCertificate
    )
  }

  protected createSiteBucket() {
    this.siteBucket = this.s3Manager.createS3Bucket(`${this.id}-site`, this, this.props.siteBucket)
  }

  protected createSiteLogBucket() {
    this.siteLogBucket = this.s3Manager.createS3Bucket(
      `${this.id}-site-logs`,
      this,
      this.props.siteLogBucket
    )
  }

  protected createSiteOriginAccessIdentity() {
    this.siteOriginAccessIdentity = this.cloudFrontManager.createOriginAccessIdentity(
      `${this.id}-oai`,
      this,
      this.siteBucket
    )
  }

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

  protected createSiteRouteAssets() {
    this.siteARecord = this.route53Manager.createCloudFrontTargetARecord(
      `${this.id}-domain-a-record`,
      this,
      this.siteDistribution,
      this.siteHostedZone,
      this.props.siteRecordName
    )
    this.siteARecordAlt = this.route53Manager.createCloudFrontTargetARecordV2(
      `${this.id}-domain-a-record-alt`,
      this,
      this.siteDistribution,
      this.siteHostedZone,
      this.props.siteRecordName
    )
  }

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
