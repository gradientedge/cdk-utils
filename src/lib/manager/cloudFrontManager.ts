import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { CommonConstruct } from '../common/commonConstruct'
import { CloudFrontProps, DistributionProps, LambdaEdgeProps } from '../types'
import { createCfnOutput } from '../utils'
import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as efs from 'aws-cdk-lib/aws-efs'

/**
 * @stability stable
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
 * @see [CDK CloudFront Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-cloudfront-readme.html}
 */
export class CloudFrontManager {
  public createOriginAccessIdentity(id: string, scope: CommonConstruct, accessBucket?: s3.IBucket) {
    const oai = new cloudfront.OriginAccessIdentity(scope, `${id}`)
    if (accessBucket) accessBucket.grantRead(oai)

    return oai
  }

  /**
   * @summary Method to create a cloudfront distribution
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {CloudFrontProps} props distribution properties
   * @param {s3.IBucket?} siteBucket
   * @param {s3.IBucket?} logBucket
   * @param {cloudfront.OriginAccessIdentity?} oai
   * @param {acm.ICertificate?} certificate
   * @param {string[]?} aliases
   */
  public createCloudFrontDistribution(
    id: string,
    scope: CommonConstruct,
    props: CloudFrontProps,
    siteBucket?: s3.IBucket,
    logBucket?: s3.IBucket,
    oai?: cloudfront.OriginAccessIdentity,
    certificate?: acm.ICertificate,
    aliases?: string[]
  ) {
    if (!siteBucket) throw `SiteBucket not defined`
    if (!certificate) throw `Certificate not defined`
    if (!props) throw `CloudFront props undefined`

    const distribution = new cloudfront.CloudFrontWebDistribution(scope, `${id}`, {
      comment: `${id} - ${scope.props.stage} stage`,
      defaultRootObject: props.defaultRootObject,
      enabled: props.enabled ?? true,
      enableIpV6: props.enableIpV6,
      errorConfigurations: props.errorConfigurations,
      geoRestriction: props.geoRestriction,
      httpVersion: props.httpVersion ?? cloudfront.HttpVersion.HTTP2,
      loggingConfig: {
        bucket: logBucket,
        prefix: 'cloudfront/',
      },
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: siteBucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_ALL,
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: aliases ? [...aliases, ...[siteBucket.bucketName]] : [siteBucket.bucketName],
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
        sslMethod: cloudfront.SSLMethod.SNI,
      }),
      webACLId: props.webACLId,
    })

    createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return distribution
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {CloudFrontProps} props distribution properties
   * @param {s3.IBucket} siteBucket
   * @param {s3.IBucket?} logBucket
   * @param {cloudfront.OriginAccessIdentity?} oai
   * @param {acm.ICertificate?} certificate
   */
  public createLambdaEdgeDistribution(
    id: string,
    scope: CommonConstruct,
    props: DistributionProps,
    siteBucket: s3.IBucket,
    logBucket?: s3.IBucket,
    oai?: cloudfront.OriginAccessIdentity,
    certificate?: acm.ICertificate
  ) {
    const origin = new origins.S3Origin(siteBucket, { originAccessIdentity: oai })
    const distribution = new cloudfront.Distribution(scope, `${id}`, {
      certificate: certificate,
      comment: `${id} - ${scope.props.stage} stage`,
      defaultBehavior: {
        origin: origin,
      },
      additionalBehaviors: props.additionalBehaviors,
      defaultRootObject: props.defaultRootObject,
      domainNames: props.domainNames ?? [siteBucket.bucketName],
      enabled: props.enabled ?? true,
      enableIpv6: props.enableIpv6,
      enableLogging: props.enableLogging ?? true,
      errorResponses: props.errorResponses,
      geoRestriction: props.geoRestriction,
      httpVersion: props.httpVersion ?? cloudfront.HttpVersion.HTTP2,
      logBucket: logBucket,
      logIncludesCookies: props.logIncludesCookies ?? true,
      logFilePrefix: props.logFilePrefix ?? `edge/`,
      minimumProtocolVersion: props.minimumProtocolVersion ?? cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_ALL,
      webAclId: props.webAclId,
    })

    createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return { origin, distribution }
  }

  /**
   * @summary Method to provision a Lambda@Edge function
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {LambdaEdgeProps} props lambda@edge properties
   * @param {lambda.ILayerVersion[]} layers
   * @param {lambda.AssetCode} code
   * @param {Map<string, string>} environment
   * @param {ec2.IVpc} vpc
   * @param {ec2.ISecurityGroup[]} securityGroups
   * @param {efs.IAccessPoint} accessPoint
   * @param {string} mountPath
   */
  public createEdgeFunction(
    id: string,
    scope: CommonConstruct,
    props: LambdaEdgeProps,
    layers: lambda.ILayerVersion[],
    code: lambda.AssetCode,
    environment?: any,
    vpc?: ec2.IVpc,
    securityGroups?: ec2.ISecurityGroup[],
    accessPoint?: efs.IAccessPoint,
    mountPath?: string
  ) {
    if (!props) throw 'EdgeFunction props undefined'

    const edgeFunction = new cloudfront.experimental.EdgeFunction(scope, `${id}`, {
      code: code,
      environment: {
        ...environment,
      },
      filesystem: accessPoint ? lambda.FileSystem.fromEfsAccessPoint(accessPoint, mountPath ?? '/mnt/msg') : undefined,
      functionName: `${props.functionName}-${scope.props.stage}`,
      handler: props.handler ?? 'index.handler',
      layers: layers,
      logRetention: props.logRetention,
      memorySize: props.memorySize,
      reservedConcurrentExecutions: props.reservedConcurrentExecutions,
      runtime: props.runtime ?? lambda.Runtime.NODEJS_14_X,
      securityGroups: securityGroups,
      stackId: `${id}-stack-id-${scope.props.stage}`,
      timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(1),
      vpc: vpc,
    })

    createCfnOutput(`${id}-edgeArn`, scope, edgeFunction.edgeArn)
    createCfnOutput(`${id}-edgeFunctionArn`, scope, edgeFunction.functionArn)
    createCfnOutput(`${id}-edgeFunctionName`, scope, edgeFunction.functionName)

    return edgeFunction
  }
}
