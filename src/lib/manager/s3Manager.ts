import * as cdk from 'aws-cdk-lib'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import { CommonConstruct } from '../common/commonConstruct'
import { S3BucketProps } from '../types'
import { createCfnOutput } from '../utils'

/**
 * @category Storage
 * @summary Provides operations on AWS S3.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.s3Manager.createS3Bucket('MyBucket', this)
 * }
 *
 * @see [CDK S3 Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-s3-readme.html}</li></i>
 */
export class S3Manager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {S3BucketProps} props bucket properties
   */
  public createS3Bucket(id: string, scope: CommonConstruct, props: S3BucketProps) {
    if (!props) throw `S3 props undefined`

    let bucket: s3.IBucket

    const bucketName = scope.isProductionStage()
      ? `${props.bucketName}.${scope.fullyQualifiedDomainName}`
      : `${props.bucketName}-${scope.props.stage}.${scope.fullyQualifiedDomainName}`

    if (props.existingBucket && props.bucketName) {
      bucket = s3.Bucket.fromBucketName(scope, `${id}`, bucketName)
    } else {
      let logBucket
      if (props.logBucketName) {
        const logBucketName = scope.isProductionStage()
          ? `${props.logBucketName}.${scope.fullyQualifiedDomainName}`
          : `${props.logBucketName}-${scope.props.stage}.${scope.fullyQualifiedDomainName}`
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
        lifecycleRules: props.lifecycleRules,
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
    }

    createCfnOutput(`${id}-bucketName`, scope, bucket.bucketName)
    createCfnOutput(`${id}-bucketArn`, scope, bucket.bucketArn)

    return bucket
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} bucket
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
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {s3.IBucket} siteBucket
   * @param {cloudfront.IDistribution} distribution
   * @param {s3deploy.ISource[]} sources
   * @param {string} prefix
   * @param {boolean} prune
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
}
