import * as cdk from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as cr from 'aws-cdk-lib/custom-resources'
import { CommonConstruct, CommonStack } from '../../../common'
import * as utils from '../../../utils'
import { CloudfrontFunctionProps, CloudFrontProps, DistributionProps } from './types'
import { LambdaEdgeProps } from '../lambda'

/**
 * @classdesc Provides operations on AWS CloudFront.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
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
 * @see [CDK CloudFront Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_cloudfront-readme.html}
 */
export class CloudFrontManager {
  public createOriginAccessIdentity(id: string, scope: CommonConstruct, accessBucket?: s3.IBucket) {
    const oai = new cloudfront.OriginAccessIdentity(scope, `${id}`, {
      comment: `${id} - ${scope.props.stage} stage`,
    })
    if (accessBucket) accessBucket.grantRead(oai)

    return oai
  }

  /**
   * @summary Method to create a cloudfront distribution
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props distribution properties
   * @param siteBucket
   * @param logBucket
   * @param oai
   * @param certificate
   * @param aliases
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
    if (!siteBucket) throw `SiteBucket not defined for ${id}`
    if (!certificate) throw `Certificate not defined for ${id}`
    if (!props) throw `CloudFront props undefined for ${id}`

    const distribution = new cloudfront.CloudFrontWebDistribution(scope, `${id}`, {
      comment: `${id} - ${scope.props.stage} stage`,
      defaultRootObject: props.defaultRootObject,
      enableIpV6: props.enableIpV6,
      enabled: props.enabled ?? true,
      errorConfigurations: props.errorConfigurations,
      geoRestriction: props.geoRestriction,
      httpVersion: props.httpVersion ?? cloudfront.HttpVersion.HTTP2,
      loggingConfig: {
        bucket: logBucket,
        prefix: 'cloudfront/',
      },
      originConfigs: [
        {
          behaviors: [{ isDefaultBehavior: true }],
          s3OriginSource: {
            originAccessIdentity: oai,
            s3BucketSource: siteBucket,
          },
        },
      ],
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_ALL,
      viewerCertificate: cloudfront.ViewerCertificate.fromAcmCertificate(certificate, {
        aliases: aliases,
        securityPolicy: cloudfront.SecurityPolicyProtocol.TLS_V1_1_2016,
        sslMethod: cloudfront.SSLMethod.SNI,
      }),
      webACLId: props.webACLId,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(distribution).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    utils.createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return distribution
  }

  /**
   * Method to create a CloudFront distribution with S3 Origin
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props distribution properties
   * @param origin
   * @param siteBucket
   * @param logBucket
   * @param oai
   * @param certificate
   * @param aliases
   * @param defaultFunctionAssociations
   */
  public createDistributionWithS3Origin(
    id: string,
    scope: CommonConstruct,
    props: DistributionProps,
    origin: origins.S3Origin,
    siteBucket: s3.IBucket,
    logBucket?: s3.IBucket,
    oai?: cloudfront.OriginAccessIdentity,
    certificate?: acm.ICertificate,
    aliases?: string[],
    defaultFunctionAssociations?: cloudfront.FunctionAssociation[]
  ) {
    const distribution = new cloudfront.Distribution(scope, `${id}`, {
      additionalBehaviors: props.additionalBehaviors,
      certificate: certificate,
      comment: `${id} - ${scope.props.stage} stage`,
      defaultBehavior: {
        cachePolicy: props.defaultBehavior ? props.defaultBehavior.cachePolicy : undefined,
        edgeLambdas: props.defaultBehavior ? props.defaultBehavior.edgeLambdas : undefined,
        functionAssociations: defaultFunctionAssociations ?? undefined,
        origin: origin,
        originRequestPolicy: props.defaultBehavior ? props.defaultBehavior.originRequestPolicy : undefined,
        viewerProtocolPolicy: props.defaultBehavior ? props.defaultBehavior.viewerProtocolPolicy : undefined,
      },
      defaultRootObject: props.defaultRootObject,
      domainNames: aliases,
      enableIpv6: props.enableIpv6,
      enableLogging: props.enableLogging ?? true,
      enabled: props.enabled ?? true,
      errorResponses: props.errorResponses,
      geoRestriction: props.geoRestriction,
      httpVersion: props.httpVersion ?? cloudfront.HttpVersion.HTTP2,
      logBucket: logBucket,
      logFilePrefix: props.logFilePrefix ?? `edge/`,
      logIncludesCookies: props.logIncludesCookies ?? true,
      minimumProtocolVersion: props.minimumProtocolVersion ?? cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_ALL,
      webAclId: props.webAclId,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(distribution).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    utils.createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return distribution
  }

  /**
   * Method to create a CloudFront distribution with HTTP Origin
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props distribution properties
   * @param origin
   * @param domainNames
   * @param logBucket
   * @param certificate
   * @param defaultFunctionAssociations
   * @param responseHeadersPolicy
   */
  public createDistributionWithHttpOrigin(
    id: string,
    scope: CommonConstruct,
    props: DistributionProps,
    origin: origins.HttpOrigin,
    domainNames: string[],
    logBucket?: s3.IBucket,
    certificate?: acm.ICertificate,
    defaultFunctionAssociations?: cloudfront.FunctionAssociation[],
    responseHeadersPolicy?: cloudfront.IResponseHeadersPolicy
  ) {
    const distribution = new cloudfront.Distribution(scope, `${id}`, {
      additionalBehaviors: props.additionalBehaviors,
      certificate: certificate,
      comment: `${id} - ${scope.props.stage} stage`,
      defaultBehavior: {
        cachePolicy: props.defaultBehavior ? props.defaultBehavior.cachePolicy : undefined,
        edgeLambdas: props.defaultBehavior ? props.defaultBehavior.edgeLambdas : undefined,
        functionAssociations: defaultFunctionAssociations ?? undefined,
        origin: origin,
        originRequestPolicy: props.defaultBehavior ? props.defaultBehavior.originRequestPolicy : undefined,
        responseHeadersPolicy: responseHeadersPolicy ?? undefined,
        viewerProtocolPolicy: props.defaultBehavior ? props.defaultBehavior.viewerProtocolPolicy : undefined,
      },
      defaultRootObject: props.defaultRootObject,
      domainNames: domainNames,
      enableIpv6: props.enableIpv6,
      enableLogging: props.enableLogging ?? true,
      enabled: props.enabled ?? true,
      errorResponses: props.errorResponses,
      geoRestriction: props.geoRestriction,
      httpVersion: props.httpVersion ?? cloudfront.HttpVersion.HTTP2,
      logBucket: logBucket,
      logFilePrefix: props.logFilePrefix ?? `edge/`,
      logIncludesCookies: props.logIncludesCookies ?? true,
      minimumProtocolVersion: props.minimumProtocolVersion ?? cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_ALL,
      webAclId: props.webAclId,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(distribution).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    utils.createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

    return distribution
  }

  /**
   * @summary Method to provision a Lambda@Edge function
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props lambda@edge properties
   * @param layers
   * @param code
   * @param role
   * @param environment
   * @param vpc
   * @param securityGroups
   * @param accessPoint
   * @param mountPath
   */
  public createEdgeFunction(
    id: string,
    scope: CommonConstruct,
    props: LambdaEdgeProps,
    layers: lambda.ILayerVersion[],
    code: lambda.AssetCode,
    role: iam.Role,
    environment?: any,
    vpc?: ec2.IVpc,
    securityGroups?: ec2.ISecurityGroup[],
    accessPoint?: efs.IAccessPoint,
    mountPath?: string
  ) {
    if (!props) throw `EdgeFunction props undefined for ${id}`

    const edgeFunction = new cloudfront.experimental.EdgeFunction(scope, `${id}`, {
      code: code,
      description: props.description,
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
      role: role,
      runtime: props.runtime ?? scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME,
      securityGroups: securityGroups,
      stackId: `${id}-stack-id-${scope.props.stage}`,
      timeout: props.timeoutInSecs ? cdk.Duration.seconds(props.timeoutInSecs) : cdk.Duration.minutes(1),
      vpc: vpc,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(edgeFunction).add(tag.key, tag.value)
      })
    }

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
    scope: CommonConstruct,
    dockerFilePath: string,
    distributionId: string,
    paths?: string
  ) {
    new cr.AwsCustomResource(scope, `${id}-trigger-codebuild-${new Date().getTime()}`, {
      onCreate: {
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
        service: 'CodeBuild',
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE }),
    })
  }

  /**
   * @summary Method to provision a Cloudfront function
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createCloudfrontFunction(id: string, scope: CommonConstruct, props: CloudfrontFunctionProps) {
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