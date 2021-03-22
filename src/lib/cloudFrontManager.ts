import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { CloudFrontProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
 * @category Networking & Content Delivery
 * @summary Provides operations on AWS CloudFront.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.cloudFrontManager.createCloudFrontDistribution(
 *       'MyDistribution',
 *       this,
 *       siteBucket,
 *       logBucket,
 *       originAccessIdentity,
 *       certificate
 *     )
 * }
 *
 * @see [CDK CloudFront Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cloudfront-readme.html}</li></i>
 */
export class CloudFrontManager {
  public createOriginAccessIdentity(id: string, scope: CommonConstruct, accessBucket?: s3.IBucket) {
    const oai = new cloudfront.OriginAccessIdentity(scope, `${id}`)
    if (accessBucket) accessBucket.grantRead(oai)

    return oai
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} siteBucket
   * @param {s3.IBucket} logBucket
   * @param {cloudfront.OriginAccessIdentity} originAccessIdentity
   * @param {acm.ICertificate} certificate
   */
  public createCloudFrontDistribution(
    id: string,
    scope: CommonConstruct,
    siteBucket?: s3.IBucket,
    logBucket?: s3.IBucket,
    originAccessIdentity?: cloudfront.OriginAccessIdentity,
    certificate?: acm.ICertificate
  ) {
    if (!siteBucket) throw `SiteBucket not defined`
    if (!certificate) throw `Certificate not defined`
    if (!scope.props.distributions || scope.props.distributions.length == 0)
      throw `CloudFront props undefined`

    const cloudFrontProps = scope.props.distributions.find((cf: CloudFrontProps) => cf.id === id)
    if (!cloudFrontProps) throw `Could not find CloudFront props for id:${id}`

    const distribution = new cloudfront.CloudFrontWebDistribution(scope, `${id}`, {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      comment: `${id} - ${scope.props.stage}`,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: originAccessIdentity,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: [siteBucket.bucketName],
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
        sslMethod: cloudfront.SSLMethod.SNI,
      }),
      loggingConfig: {
        bucket: logBucket,
        prefix: 'cloudfront/',
      },
      errorConfigurations: cloudFrontProps.errorConfigurations,
    })

    createCfnOutput(`${id}Id`, scope, distribution.distributionId)
    createCfnOutput(`${id}DomainName`, scope, distribution.distributionDomainName)

    return distribution
  }
}
