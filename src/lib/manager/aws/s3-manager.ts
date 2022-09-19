import * as cdk from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.s3-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS S3.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.s3Manager.createS3Bucket('MyBucket', this)
 *   }
 * }
 *
 * @see [CDK S3 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html}
 */
export class S3Manager {
  /**
   * @summary Method to determine S3 Bucket lifecycle properties
   * @param {types.S3BucketProps} props bucket properties
   * @private
   */
  protected determineBucketLifecycleRules(props: types.S3BucketProps) {
    if (!props.lifecycleRules) return undefined

    const bucketLifecycleRules: types.LifecycleRule[] = []
    props.lifecycleRules.forEach(lifecycleRule => {
      bucketLifecycleRules.push({
        id: lifecycleRule.id,
        enabled: lifecycleRule.enabled,
        abortIncompleteMultipartUploadAfter: lifecycleRule.abortIncompleteMultipartUploadAfter,
        expirationDate: lifecycleRule.expirationDate,
        expiration: lifecycleRule.expirationInDays ? cdk.Duration.days(lifecycleRule.expirationInDays) : undefined,
        noncurrentVersionExpiration: lifecycleRule.noncurrentVersionExpirationInDays
          ? cdk.Duration.days(lifecycleRule.noncurrentVersionExpirationInDays)
          : undefined,
        noncurrentVersionTransitions: lifecycleRule.noncurrentVersionTransitions,
        transitions: lifecycleRule.transitions,
        prefix: lifecycleRule.prefix,
        tagFilters: lifecycleRule.tagFilters,
        expiredObjectDeleteMarker: lifecycleRule.expiredObjectDeleteMarker,
      })
    })

    return bucketLifecycleRules
  }

  /**
   * @summary Method to determine the bucket name
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.S3BucketProps} props bucket properties
   * @private
   */
  protected static determineBucketName(scope: common.CommonConstruct, props: types.S3BucketProps) {
    return scope.isProductionStage()
      ? `${props.bucketName}.${scope.fullyQualifiedDomainName}`
      : `${props.bucketName}-${scope.props.stage}.${scope.fullyQualifiedDomainName}`
  }

  /**
   * @summary Method to determine the log bucket name
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.S3BucketProps} props bucket properties
   * @private
   */
  protected static determineLogBucketName(scope: common.CommonConstruct, props: types.S3BucketProps) {
    return scope.isProductionStage()
      ? `${props.logBucketName}.${scope.fullyQualifiedDomainName}`
      : `${props.logBucketName}-${scope.props.stage}.${scope.fullyQualifiedDomainName}`
  }

  /**
   * @summary Method to create a s3 bucket
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.S3BucketProps} props bucket properties
   */
  public createS3Bucket(id: string, scope: common.CommonConstruct, props: types.S3BucketProps) {
    if (!props) throw `S3 props undefined`

    let bucket: s3.IBucket

    const bucketName = S3Manager.determineBucketName(scope, props)

    if (props.existingBucket && props.bucketName) {
      bucket = s3.Bucket.fromBucketName(scope, `${id}`, bucketName)
    } else {
      let logBucket
      if (props.logBucketName) {
        const logBucketName = S3Manager.determineLogBucketName(scope, props)
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
        publicReadAccess: props.publicReadAccess,
        removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
        serverAccessLogsBucket: logBucket,
        serverAccessLogsPrefix: props.serverAccessLogsPrefix,
        websiteIndexDocument: props.websiteIndexDocument,
        websiteErrorDocument: props.websiteErrorDocument,
        websiteRoutingRules: props.websiteRoutingRules,
        versioned: props.versioned,
      })

      const cfnBucket = bucket.node.defaultChild as s3.CfnBucket
      cfnBucket.notificationConfiguration = {
        eventBridgeConfiguration: {
          eventBridgeEnabled: props.enableEventBridge ?? false,
        },
      }
    }

    utils.createCfnOutput(`${id}-bucketName`, scope, bucket.bucketName)
    utils.createCfnOutput(`${id}-bucketArn`, scope, bucket.bucketArn)

    return bucket
  }

  /**
   * @summary Method to create an iam bucket policy for cloudtrail
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} bucket
   */
  public createBucketPolicyForCloudTrail(id: string, scope: common.CommonConstruct, bucket: s3.IBucket) {
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} siteBucket
   * @param {cloudfront.IDistribution} distribution
   * @param {s3deploy.ISource[]} sources
   * @param {string} prefix
   * @param {boolean} prune
   */
  public doBucketDeployment(
    id: string,
    scope: common.CommonConstruct,
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
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} bucket bucket to create the folders in
   * @param {string[]} folders list of folder names to be created in the bucket
   */
  public createBucketFolders(id: string, scope: common.CommonConstruct, bucket: s3.IBucket, folders: string[]) {
    if (!folders || folders.length == 0) {
      throw `Folder unspecified for ${id}`
    }

    folders.forEach(folder => {
      new s3deploy.BucketDeployment(scope, `${folder}`, {
        destinationBucket: bucket,
        destinationKeyPrefix: folder,
        sources: [s3deploy.Source.data('README.md', `This is the ${folder} folder for ${id}`)],
        prune: false,
      })
    })
  }
}
