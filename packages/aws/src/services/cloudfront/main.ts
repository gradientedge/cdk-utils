import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib'
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import * as cf from 'aws-cdk-lib/aws-cloudfront'
import {
  Distribution,
  DistributionAttributes,
  Function,
  FunctionAssociation,
  FunctionCode,
  HttpVersion,
  IDistribution,
  IResponseHeadersPolicyRef,
  OriginAccessIdentity,
  PriceClass,
  SecurityPolicyProtocol,
} from 'aws-cdk-lib/aws-cloudfront'
import { HttpOrigin, S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins'
import { ISecurityGroup, IVpc } from 'aws-cdk-lib/aws-ec2'
import { IAccessPoint } from 'aws-cdk-lib/aws-efs'
import { Role } from 'aws-cdk-lib/aws-iam'
import { AssetCode, FileSystem, ILayerVersion } from 'aws-cdk-lib/aws-lambda'
import { IBucket } from 'aws-cdk-lib/aws-s3'
import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from 'aws-cdk-lib/custom-resources'
import _ from 'lodash'
import { CommonConstruct, CommonStack } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'
import { LambdaEdgeProps } from '../lambda/index.js'
import { CloudfrontFunctionProps, DistributionProps } from './types.js'

/**
 * @classdesc Provides operations on AWS
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
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
  public createOriginAccessIdentity(id: string, scope: CommonConstruct, accessBucket?: IBucket) {
    const oai = new OriginAccessIdentity(scope, `${id}`, {
      comment: `${id} - ${scope.props.stage} stage`,
    })
    if (accessBucket) accessBucket.grantRead(oai)

    return oai
  }

  /**
   * Method to create a CloudFront distribution with S3 Origin
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props distribution properties
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
    siteBucket: IBucket,
    logBucket?: IBucket,
    oai?: OriginAccessIdentity,
    certificate?: ICertificate,
    aliases?: string[],
    defaultFunctionAssociations?: FunctionAssociation[]
  ) {
    const distribution = new Distribution(scope, `${id}`, {
      ...props,
      certificate,
      comment: `${id} - ${scope.props.stage} stage`,
      defaultBehavior: {
        ...props.defaultBehavior,
        functionAssociations: defaultFunctionAssociations ?? undefined,
        origin: S3BucketOrigin.withOriginAccessIdentity(siteBucket, { originAccessIdentity: oai }),
      },
      domainNames: aliases,
      enableLogging: props.enableLogging ?? true,
      enabled: props.enabled ?? true,
      httpVersion: props.httpVersion ?? HttpVersion.HTTP2,
      logBucket,
      logFilePrefix: props.logFilePrefix ?? `edge/`,
      logIncludesCookies: props.logIncludesCookies ?? true,
      minimumProtocolVersion: props.minimumProtocolVersion ?? SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: props.priceClass ?? PriceClass.PRICE_CLASS_ALL,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(distribution).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

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
    origin: HttpOrigin,
    domainNames: string[],
    logBucket?: IBucket,
    certificate?: ICertificate,
    defaultFunctionAssociations?: FunctionAssociation[],
    responseHeadersPolicy?: IResponseHeadersPolicyRef
  ) {
    const distribution = new Distribution(scope, `${id}`, {
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
      httpVersion: props.httpVersion ?? HttpVersion.HTTP2,
      logBucket: logBucket,
      logFilePrefix: props.logFilePrefix ?? `edge/`,
      logIncludesCookies: props.logIncludesCookies ?? true,
      minimumProtocolVersion: props.minimumProtocolVersion ?? SecurityPolicyProtocol.TLS_V1_2_2021,
      priceClass: props.priceClass ?? PriceClass.PRICE_CLASS_ALL,
      webAclId: props.webAclId,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(distribution).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-distributionId`, scope, distribution.distributionId)
    createCfnOutput(`${id}-distributionDomainName`, scope, distribution.distributionDomainName)

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
    layers: ILayerVersion[],
    code: AssetCode,
    role: Role,
    environment?: any,
    vpc?: IVpc,
    securityGroups?: ISecurityGroup[],
    accessPoint?: IAccessPoint,
    mountPath?: string
  ) {
    if (!props) throw `EdgeFunction props undefined for ${id}`
    if (!props.functionName) throw `EdgeFunction functionName undefined for ${id}`

    const functionName = scope.resourceNameFormatter.format(
      props.functionName,
      scope.props.resourceNameOptions?.cloudfront
    )
    const edgeFunction = new cf.experimental.EdgeFunction(scope, `${id}`, {
      code: code,
      description: props.description,
      environment: {
        ...environment,
      },
      filesystem: accessPoint ? FileSystem.fromEfsAccessPoint(accessPoint, mountPath ?? '/mnt/msg') : undefined,
      functionName,
      handler: props.handler ?? 'index.handler',
      layers: layers,
      logGroup: scope.logManager.createLogGroup(`${id}-log-group`, scope, {
        logGroupName: functionName,
        removalPolicy: RemovalPolicy.DESTROY,
        retention: scope.props.logRetention,
      }),
      memorySize: props.memorySize,
      reservedConcurrentExecutions: props.reservedConcurrentExecutions,
      role: role,
      runtime: props.runtime ?? scope.props.nodejsRuntime ?? CommonStack.NODEJS_RUNTIME,
      securityGroups: securityGroups,
      stackId: `${id}-stack-id-${scope.props.stage}`,
      timeout: props.timeoutInSecs ? Duration.seconds(props.timeoutInSecs) : Duration.minutes(1),
      vpc: vpc,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      props.tags.forEach(tag => {
        Tags.of(edgeFunction).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-edgeArn`, scope, edgeFunction.edgeArn)
    createCfnOutput(`${id}-edgeFunctionArn`, scope, edgeFunction.functionArn)
    createCfnOutput(`${id}-edgeFunctionName`, scope, edgeFunction.functionName)

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
    new AwsCustomResource(scope, `${id}-trigger-codebuild-${new Date().getTime()}`, {
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
        physicalResourceId: PhysicalResourceId.fromResponse('build.id'),
        service: 'CodeBuild',
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
    })
  }

  /**
   * @summary Method to provision a Cloudfront function
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createCloudfrontFunction(id: string, scope: CommonConstruct, props: CloudfrontFunctionProps) {
    if (!props) throw `CloudFront Function props undefined for ${id}`
    if (!props.functionName) throw `CloudFront Function functionName undefined for ${id}`

    const cloudfrontFunction = new Function(scope, `${id}`, {
      ...props,
      code: FunctionCode.fromFile({
        filePath: props.functionFilePath,
      }),
      functionName: scope.resourceNameFormatter.format(props.functionName, scope.props.resourceNameOptions?.cloudfront),
    })

    createCfnOutput(`${id}-functionArn`, scope, cloudfrontFunction.functionArn)
    createCfnOutput(`${id}-functionName`, scope, cloudfrontFunction.functionName)

    return cloudfrontFunction
  }

  public resolveDistribution(scope: CommonConstruct, props: DistributionAttributes): IDistribution {
    return Distribution.fromDistributionAttributes(scope, `${scope.node.id}-sa-distribution`, props)
  }
}
