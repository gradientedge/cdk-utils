import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cr from 'aws-cdk-lib/custom-resources'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'
import { LambdaManager } from './lambda-manager'

/**
 * @stability stable
 * @category cdk-utils.cloudfront-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS CloudFront.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
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
 *   }
 * }
 *
 * @see [CDK CloudFront Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html}
 */
export class CloudFrontManager {
  public createOriginAccessIdentity(id: string, scope: common.CommonConstruct, accessBucket?: s3.IBucket) {
    const oai = new cloudfront.OriginAccessIdentity(scope, `${id}`, {
      comment: `${id} - ${scope.props.stage} stage`,
    })
    if (accessBucket) accessBucket.grantRead(oai)

    return oai
  }

  /**
   * @deprecated Use `createDistributionWithS3Origin` instead
   *
   * @summary Method to create a cloudfront distribution
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.CloudFrontProps} props distribution properties
   * @param {s3.IBucket?} siteBucket
   * @param {s3.IBucket?} logBucket
   * @param {cloudfront.OriginAccessIdentity?} oai
   * @param {acm.ICertificate?} certificate
   * @param {string[]?} aliases
   */
  public createCloudFrontDistribution(
    id: string,
    scope: common.CommonConstruct,
    props: types.CloudFrontProps,
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

    utils.createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    utils.createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return distribution
  }

  /**
   * Method to create a CloudFront distribution with S3 Origin
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.DistributionProps} props distribution properties
   * @param {origins.S3Origin} origin
   * @param {s3.IBucket} siteBucket
   * @param {s3.IBucket?} logBucket
   * @param {cloudfront.OriginAccessIdentity?} oai
   * @param {acm.ICertificate?} certificate
   * @param {string[]?} aliases
   * @param {cloudfront.FunctionAssociation?} defaultFunctionAssociations
   */
  public createDistributionWithS3Origin(
    id: string,
    scope: common.CommonConstruct,
    props: types.DistributionProps,
    origin: origins.S3Origin,
    siteBucket: s3.IBucket,
    logBucket?: s3.IBucket,
    oai?: cloudfront.OriginAccessIdentity,
    certificate?: acm.ICertificate,
    aliases?: string[],
    defaultFunctionAssociations?: cloudfront.FunctionAssociation[]
  ) {
    const distribution = new cloudfront.Distribution(scope, `${id}`, {
      certificate: certificate,
      comment: `${id} - ${scope.props.stage} stage`,
      defaultBehavior: {
        cachePolicy: props.defaultBehavior ? props.defaultBehavior.cachePolicy : undefined,
        origin: origin,
        originRequestPolicy: props.defaultBehavior ? props.defaultBehavior.originRequestPolicy : undefined,
        functionAssociations: defaultFunctionAssociations ?? undefined,
        viewerProtocolPolicy: props.defaultBehavior ? props.defaultBehavior.viewerProtocolPolicy : undefined,
      },
      additionalBehaviors: props.additionalBehaviors,
      defaultRootObject: props.defaultRootObject,
      domainNames: aliases ? [...aliases, ...[siteBucket.bucketName]] : [siteBucket.bucketName],
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

    utils.createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    utils.createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return distribution
  }

  /**
   * Method to create a CloudFront distribution with HTTP Origin
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.DistributionProps} props distribution properties
   * @param {origins.S3Origin} origin
   * @param {string[]} domainNames
   * @param {s3.IBucket?} logBucket
   * @param {acm.ICertificate?} certificate
   * @param {cloudfront.FunctionAssociation?} defaultFunctionAssociations
   */
  public createDistributionWithHttpOrigin(
    id: string,
    scope: common.CommonConstruct,
    props: types.DistributionProps,
    origin: origins.HttpOrigin,
    domainNames: string[],
    logBucket?: s3.IBucket,
    certificate?: acm.ICertificate,
    defaultFunctionAssociations?: cloudfront.FunctionAssociation[]
  ) {
    const distribution = new cloudfront.Distribution(scope, `${id}`, {
      certificate: certificate,
      comment: `${id} - ${scope.props.stage} stage`,
      defaultBehavior: {
        cachePolicy: props.defaultBehavior ? props.defaultBehavior.cachePolicy : undefined,
        origin: origin,
        originRequestPolicy: props.defaultBehavior ? props.defaultBehavior.originRequestPolicy : undefined,
        functionAssociations: defaultFunctionAssociations ?? undefined,
        viewerProtocolPolicy: props.defaultBehavior ? props.defaultBehavior.viewerProtocolPolicy : undefined,
      },
      additionalBehaviors: props.additionalBehaviors,
      defaultRootObject: props.defaultRootObject,
      domainNames: domainNames,
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

    utils.createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    utils.createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return distribution
  }

  /**
   * @summary Method to provision a Lambda@Edge function
   *
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaEdgeProps} props lambda@edge properties
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
    scope: common.CommonConstruct,
    props: types.LambdaEdgeProps,
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
      runtime: props.runtime ?? LambdaManager.NODEJS_RUNTIME,
      securityGroups: securityGroups,
      stackId: `${id}-stack-id-${scope.props.stage}`,
      timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(1),
      vpc: vpc,
    })

    utils.createCfnOutput(`${id}-edgeArn`, scope, edgeFunction.edgeArn)
    utils.createCfnOutput(`${id}-edgeFunctionArn`, scope, edgeFunction.functionArn)
    utils.createCfnOutput(`${id}-edgeFunctionName`, scope, edgeFunction.functionName)

    return edgeFunction
  }

  /**
   *
   * @param id
   * @param scope
   * @param dockerFilePath
   * @param distributionId
   * @param paths
   */
  public invalidateCache(
    id: string,
    scope: common.CommonConstruct,
    dockerFilePath: string,
    distributionId: string,
    paths?: string
  ) {
    new cr.AwsCustomResource(scope, `${id}-trigger-codebuild-${new Date().getTime()}`, {
      onCreate: {
        service: 'CodeBuild',
        action: 'startBuild',
        parameters: {
          projectName: scope.codeBuildManager.createProjectForCloudfrontInvalidation(
            id,
            scope,
            dockerFilePath,
            distributionId,
            paths
          ).projectName,
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('build.id'),
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE }),
    })
  }

  /**
   * @summary Method to provision a Cloudfront function
   *
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.CloudfrontFunctionProps} props
   */
  public createCloudfrontFunction(id: string, scope: common.CommonConstruct, props: types.CloudfrontFunctionProps) {
    const cloudfrontFunction = new cloudfront.Function(scope, `${id}`, {
      code: cloudfront.FunctionCode.fromFile({
        filePath: props.functionFilePath,
      }),
      comment: props.comment,
      functionName: `${props.functionName}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-functionArn`, scope, cloudfrontFunction.functionArn)
    utils.createCfnOutput(`${id}-functionName`, scope, cloudfrontFunction.functionName)

    return cloudfrontFunction
  }
}
