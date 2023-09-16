import { Duration, RemovalPolicy, Stack, Tags } from 'aws-cdk-lib'
import { IDistribution } from 'aws-cdk-lib/aws-cloudfront'
import { Effect, PolicyDocument, PolicyStatement, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { BlockPublicAccess, Bucket, BucketEncryption, CfnBucket, CfnBucketPolicy, IBucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, ISource, ServerSideEncryption, Source } from 'aws-cdk-lib/aws-s3-deployment'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { LifecycleRule, S3BucketProps } from './types'

/**
 * @classdesc Provides operations on AWS S3
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
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
    _.forEach(props.lifecycleRules, lifecycleRule => {
      bucketLifecycleRules.push({
        ...lifecycleRule,
        expiration: lifecycleRule.expirationInDays ? Duration.days(lifecycleRule.expirationInDays) : undefined,
        noncurrentVersionExpiration: lifecycleRule.noncurrentVersionExpirationInDays
          ? Duration.days(lifecycleRule.noncurrentVersionExpirationInDays)
          : undefined,
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
    return `${bucketName}-${Stack.of(scope).account}-${scope.props.region}-${scope.props.stage}`
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

    let bucket: IBucket

    const bucketName = S3Manager.determineBucketName(scope, props.bucketName)

    if (props.existingBucket && props.bucketName) {
      bucket = Bucket.fromBucketName(scope, `${id}`, bucketName)
    } else {
      let logBucket
      if (props.logBucketName) {
        const logBucketName = S3Manager.determineBucketName(scope, props.logBucketName)
        logBucket = Bucket.fromBucketName(scope, `${id}-logs`, logBucketName)
      }

      bucket = new Bucket(scope, `${id}-bucket`, {
        ...props,
        blockPublicAccess: props.blockPublicAccess || BlockPublicAccess.BLOCK_ALL,
        bucketName,
        encryption: props.encryption || BucketEncryption.S3_MANAGED,
        lifecycleRules: this.determineBucketLifecycleRules(props),
        removalPolicy: props.removalPolicy || RemovalPolicy.RETAIN,
        serverAccessLogsBucket: logBucket,
      })

      const cfnBucket = bucket.node.defaultChild as CfnBucket
      cfnBucket.notificationConfiguration = {
        eventBridgeConfiguration: {
          eventBridgeEnabled: props.enableEventBridge ?? false,
        },
      }
    }

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(bucket).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-bucketName`, scope, bucket.bucketName)
    createCfnOutput(`${id}-bucketArn`, scope, bucket.bucketArn)

    return bucket
  }

  /**
   * @summary Method to create an iam bucket policy for cloudtrail
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param bucket
   */
  public createBucketPolicyForCloudTrail(id: string, scope: CommonConstruct, bucket: IBucket) {
    const bucketPolicyDocument = new PolicyDocument({
      statements: [
        new PolicyStatement({
          actions: ['s3:GetBucketAcl'],
          effect: Effect.ALLOW,
          principals: [new ServicePrincipal('cloudtrail.amazonaws.com')],
          resources: [bucket.bucketArn],
          sid: 'AWSCloudTrailAclCheck20150319',
        }),
        new PolicyStatement({
          actions: ['s3:PutObject'],
          effect: Effect.ALLOW,
          principals: [new ServicePrincipal('cloudtrail.amazonaws.com')],
          resources: [bucket.arnForObjects('*')],
          sid: 'AWSCloudTrailWrite20150319',
        }),
      ],
    })

    return new CfnBucketPolicy(scope, `${id}`, {
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
    siteBucket: IBucket,
    distribution: IDistribution,
    sources: ISource[],
    prefix: string,
    prune?: boolean
  ) {
    new BucketDeployment(scope, `${id}`, {
      destinationBucket: siteBucket,
      destinationKeyPrefix: prefix,
      distribution: distribution,
      distributionPaths: ['/*'],
      memoryLimit: 1024,
      prune: !!prune,
      serverSideEncryption: ServerSideEncryption.AES_256,
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
  public createBucketFolders(id: string, scope: CommonConstruct, bucket: IBucket, folders: string[]) {
    if (!folders || folders.length == 0) {
      throw `Folder unspecified for ${id}`
    }

    _.forEach(folders, folder => {
      new BucketDeployment(scope, `${id}-${folder}`, {
        destinationBucket: bucket,
        destinationKeyPrefix: folder,
        prune: false,
        sources: [Source.data('README.md', `This is the ${folder} folder for ${id}`)],
      })
    })
  }
}
