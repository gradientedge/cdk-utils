import * as acm from '@aws-cdk/aws-certificatemanager'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as s3 from '@aws-cdk/aws-s3'
import { CommonConstruct } from './commonConstruct'
import { CloudFrontProps, CommonStackProps } from './types'
import { createCfnOutput } from './genericUtils'

export class CloudFrontManager {
  public createOriginAccessIdentity(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    accessBucket?: s3.IBucket
  ) {
    const oai = new cloudfront.OriginAccessIdentity(scope, `${id}`)
    if (accessBucket) accessBucket.grantRead(oai)

    return oai
  }

  public createCloudFrontDistribution(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    siteBucket?: s3.IBucket,
    logBucket?: s3.IBucket,
    originAccessIdentity?: cloudfront.OriginAccessIdentity,
    certificate?: acm.ICertificate
  ) {
    if (!siteBucket) throw `SiteBucket not defined`
    if (!certificate) throw `Certificate not defined`
    if (!props.distributions || props.distributions.length == 0) throw `CloudFront props undefined`

    const cloudFrontProps = props.distributions.find((cf: CloudFrontProps) => cf.id === id)
    if (!cloudFrontProps) throw `Could not find CloudFront props for id:${id}`

    const distribution = new cloudfront.CloudFrontWebDistribution(scope, `${id}`, {
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      comment: `${id} - ${props.stage}`,
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
