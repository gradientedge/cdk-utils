import * as cdk from '@aws-cdk/core'
import * as cloudfront from '@aws-cdk/aws-cloudfront'
import * as iam from '@aws-cdk/aws-iam'
import * as s3 from '@aws-cdk/aws-s3'
import * as s3deploy from '@aws-cdk/aws-s3-deployment'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps, S3BucketProps } from './types'
import { createCfnOutput } from './genericUtils'

export class S3Manager {
  public createS3Bucket(id: string, scope: CommonConstruct, props: CommonStackProps) {
    if (!props.buckets || props.buckets.length == 0) throw `S3 props undefined`

    const s3Props = props.buckets.find((s: S3BucketProps) => s.id === id)
    if (!s3Props) throw `Could not find s3 props for id:${id}`

    let bucket: s3.IBucket

    const bucketName = scope.isProductionStage()
      ? `${s3Props.bucketName}.${scope.fullyQualifiedDomainName}`
      : `${s3Props.bucketName}-${props.stage}.${scope.fullyQualifiedDomainName}`

    if (s3Props.existingBucket && s3Props.bucketName) {
      bucket = s3.Bucket.fromBucketName(scope, `${id}`, bucketName)
    } else {
      let logBucket
      if (s3Props.logBucketName) {
        const logBucketName = scope.isProductionStage()
          ? `${s3Props.logBucketName}.${scope.fullyQualifiedDomainName}`
          : `${s3Props.logBucketName}-${props.stage}.${scope.fullyQualifiedDomainName}`
        logBucket = s3.Bucket.fromBucketName(scope, `${id}Logs`, logBucketName)
      }

      bucket = new s3.Bucket(scope, `${id}`, {
        accessControl: s3Props.accessControl,
        autoDeleteObjects: s3Props.autoDeleteObjects,
        blockPublicAccess: s3Props.blockPublicAccess || s3.BlockPublicAccess.BLOCK_ALL,
        bucketName: bucketName,
        cors: s3Props.cors,
        encryption: s3Props.encryption || s3.BucketEncryption.S3_MANAGED,
        encryptionKey: s3Props.encryptionKey,
        lifecycleRules: s3Props.lifecycleRules,
        metrics: s3Props.metrics,
        publicReadAccess: s3Props.publicReadAccess,
        removalPolicy: s3Props.removalPolicy || cdk.RemovalPolicy.RETAIN,
        serverAccessLogsBucket: logBucket,
        serverAccessLogsPrefix: s3Props.serverAccessLogsPrefix,
        websiteIndexDocument: s3Props.websiteIndexDocument,
        websiteErrorDocument: s3Props.websiteErrorDocument,
        websiteRoutingRules: s3Props.websiteRoutingRules,
        versioned: s3Props.versioned,
      })
    }

    createCfnOutput(`${id}Name`, scope, bucket.bucketName)
    createCfnOutput(`${id}Arn`, scope, bucket.bucketArn)

    return bucket
  }

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
