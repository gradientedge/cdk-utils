import * as certificateManager from '@aws-cdk/aws-certificatemanager'
import * as cdk from '@aws-cdk/core'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as route53 from '@aws-cdk/aws-route53'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { StaticSiteProps } from './types'

/**
 *
 */
export class StaticSiteConstruct extends CommonConstruct {
  id: string
  props: StaticSiteProps
  siteHostedZone: route53.IHostedZone
  siteCertificate: certificateManager.ICertificate
  siteARecord: route53.ARecord
  siteARecordAlt: route53.ARecord
  siteBucket: s3.IBucket
  siteDistribution: cloudfront.IDistribution
  siteLogBucket: s3.IBucket
  siteOriginAccessIdentity: cloudfront.OriginAccessIdentity

  constructor(parent: cdk.Construct, id: string, props: StaticSiteProps) {
    super(parent, id, props)
    this.id = id
    this.props = props

    this.provisionResources()
  }

  protected provisionResources() {
    this.siteHostedZone = route53.HostedZone.fromLookup(this, `${this.id}-hosted-zone`, {
      domainName: this.props.hostedZoneDomainName || this.fullyQualifiedDomainName,
    })

    this.siteCertificate = this.acmManager.createCertificate(`${this.id}-certificate`, this)

    this.siteLogBucket = this.s3Manager.createS3Bucket(`${this.id}-log-bucket`, this)

    this.siteBucket = this.s3Manager.createS3Bucket(`${this.id}-bucket`, this)

    this.siteOriginAccessIdentity = this.cloudFrontManager.createOriginAccessIdentity(
      `${this.id}-oai`,
      this,
      this.siteBucket
    )
    this.siteDistribution = this.cloudFrontManager.createCloudFrontDistribution(
      `${this.id}-distribution`,
      this,
      this.siteBucket,
      this.siteLogBucket,
      this.siteOriginAccessIdentity,
      this.siteCertificate,
      this.props.aliases
    )

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
