import * as cdk from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as utils from '../../../utils'
import { LifecycleRule, S3BucketProps } from './types'
import { CommonConstruct } from '../../../common'

/**
 * @classdesc Provides operations on AWS S3.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.s3Manager.createS3Bucket('MyBucket', this)
 *   }
 * }
 * @see [CDK S3 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html}
 */
export class S3Manager {
  /**
   * @summary Method to determine S3 Bucket lifecycle properties
   * @param props bucket properties
   */
  protected determineBucketLifecycleRules(props: S3BucketProps) {
    if (!props.lifecycleRules) return undefined

    const bucketLifecycleRules: LifecycleRule[] = []
    props.lifecycleRules.forEach(lifecycleRule => {
      bucketLifecycleRules.push({
        abortIncompleteMultipartUploadAfter: lifecycleRule.abortIncompleteMultipartUploadAfter,
        enabled: lifecycleRule.enabled,
        expiration: lifecycleRule.expirationInDays ? cdk.Duration.days(lifecycleRule.expirationInDays) : undefined,
        expirationDate: lifecycleRule.expirationDate,
        expiredObjectDeleteMarker: lifecycleRule.expiredObjectDeleteMarker,
        id: lifecycleRule.id,
        noncurrentVersionExpiration: lifecycleRule.noncurrentVersionExpirationInDays
          ? cdk.Duration.days(lifecycleRule.noncurrentVersionExpirationInDays)
          : undefined,
        noncurrentVersionTransitions: lifecycleRule.noncurrentVersionTransitions,
        prefix: lifecycleRule.prefix,
        tagFilters: lifecycleRule.tagFilters,
        transitions: lifecycleRule.transitions,
      })
    })

    return bucketLifecycleRules
  }

  /**
   * @summary Method to determine the bucket name using account and region
   * @param scope scope in which this resource is defined
   * @param bucketName the bucket name
   */
  protected static determineBucketNameByAccountAndRegion(scope: CommonConstruct, bucketName: string) {
    return `${bucketName}-${cdk.Stack.of(scope).account}-${scope.props.region}-${scope.props.stage}`
  }

  /**
   * @summary Method to determine the bucket name using domain name
   * @param scope scope in which this resource is defined
   * @param bucketName the bucket name
   */
  protected static determineBucketNameByDomainName(scope: CommonConstruct, bucketName: string) {
    return scope.isProductionStage()
      ? `${bucketName}.${scope.fullyQualifiedDomainName}`
      : `${bucketName}-${scope.props.stage}.${scope.fullyQualifiedDomainName}`
  }

  /**
   * @summary Method to determine the bucket name
   * @param scope scope in which this resource is defined
   * @param bucketName the bucket name
   */
  public static determineBucketName(scope: CommonConstruct, bucketName: string) {
    return scope.props.excludeDomainNameForBuckets
      ? S3Manager.determineBucketNameByAccountAndRegion(scope, bucketName)
      : S3Manager.determineBucketNameByDomainName(scope, bucketName)
  }

  /**
   * @summary Method to create a s3 bucket
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props bucket properties
   */
  public createS3Bucket(id: string, scope: CommonConstruct, props: S3BucketProps) {
    if (!props) throw `S3 props undefined for ${id}`

    let bucket: s3.IBucket

    const bucketName = S3Manager.determineBucketName(scope, props.bucketName)

    if (props.existingBucket && props.bucketName) {
      bucket = s3.Bucket.fromBucketName(scope, `${id}`, bucketName)
    } else {
      let logBucket
      if (props.logBucketName) {
        const logBucketName = S3Manager.determineBucketName(scope, props.logBucketName)
        logBucket = s3.Bucket.fromBucketName(scope, `${id}-logs`, logBucketName)
      }

      bucket = new s3.Bucket(scope, `${id}-bucket`, {
        accessControl: props.accessControl,
        autoDeleteObjects: props.autoDeleteObjects,
        blockPublicAccess: props.blockPublicAccess || s3.BlockPublicAccess.BLOCK_ALL,
        bucketName: bucketName,
        cors: props.cors,
        encryption: props.encryption || s3.BucketEncryption.S3_MANAGED,
        encryptionKey: props.encryptionKey,
        lifecycleRules: this.determineBucketLifecycleRules(props),
        metrics: props.metrics,
        objectOwnership: props.objectOwnership,
        publicReadAccess: props.publicReadAccess,
        removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
        serverAccessLogsBucket: logBucket,
        serverAccessLogsPrefix: props.serverAccessLogsPrefix,
        versioned: props.versioned,
        websiteErrorDocument: props.websiteErrorDocument,
        websiteIndexDocument: props.websiteIndexDocument,
        websiteRoutingRules: props.websiteRoutingRules,
      })

      const cfnBucket = bucket.node.defaultChild as s3.CfnBucket
      cfnBucket.notificationConfiguration = {
        eventBridgeConfiguration: {
          eventBridgeEnabled: props.enableEventBridge ?? false,
        },
      }
    }

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(bucket).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-bucketName`, scope, bucket.bucketName)
    utils.createCfnOutput(`${id}-bucketArn`, scope, bucket.bucketArn)

    return bucket
  }

  /**
   * @summary Method to create an iam bucket policy for cloudtrail
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param bucket
   */
  public createBucketPolicyForCloudTrail(id: string, scope: CommonConstruct, bucket: s3.IBucket) {
    const bucketPolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['s3:GetBucketAcl'],
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
          resources: [bucket.bucketArn],
          sid: 'AWSCloudTrailAclCheck20150319',
        }),
        new iam.PolicyStatement({
          actions: ['s3:PutObject'],
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
          resources: [bucket.arnForObjects('*')],
          sid: 'AWSCloudTrailWrite20150319',
        }),
      ],
    })

    return new s3.CfnBucketPolicy(scope, `${id}`, {
      bucket: bucket.bucketName,
      policyDocument: bucketPolicyDocument,
    })
  }

  /**
   * @summary Method to create a s3 bucket deployment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param siteBucket
   * @param distribution
   * @param sources
   * @param prefix
   * @param prune
   */
  public doBucketDeployment(
    id: string,
    scope: CommonConstruct,
    siteBucket: s3.IBucket,
    distribution: cloudfront.IDistribution,
    sources: s3deploy.ISource[],
    prefix: string,
    prune?: boolean
  ) {
    new s3deploy.BucketDeployment(scope, `${id}`, {
      destinationBucket: siteBucket,
      destinationKeyPrefix: prefix,
      distribution: distribution,
      distributionPaths: ['/*'],
      memoryLimit: 1024,
      prune: !!prune,
      serverSideEncryption: s3deploy.ServerSideEncryption.AES_256,
      sources: sources,
    })
  }

  /**
   *
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param bucket bucket to create the folders in
   * @param folders list of folder names to be created in the bucket
   */
  public createBucketFolders(id: string, scope: CommonConstruct, bucket: s3.IBucket, folders: string[]) {
    if (!folders || folders.length == 0) {
      throw `Folder unspecified for ${id}`
    }

    folders.forEach(folder => {
      new s3deploy.BucketDeployment(scope, `${id}-${folder}`, {
        destinationBucket: bucket,
        destinationKeyPrefix: folder,
        prune: false,
        sources: [s3deploy.Source.data('README.md', `This is the ${folder} folder for ${id}`)],
      })
    })
  }
}
