import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'

import { TagProps } from '../../types/index.js'

/**
 * Properties for configuring an S3 bucket lifecycle rule with convenience duration fields.
 * @see [CDK S3 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html}
 */
/** @category Interface */
export interface LifecycleRule extends s3.LifecycleRule {
  /** Number of days after which objects expire */
  expirationInDays?: number
  /** Number of days after which noncurrent object versions expire */
  noncurrentVersionExpirationInDays?: number
}

/**
 * Properties for configuring an S3 bucket deployment with convenience duration fields.
 * @see [CDK S3 Deployment Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3_deployment-readme.html}
 */
/** @category Interface */
export interface BucketDeploymentProps extends s3deploy.BucketDeploymentProps {
  /** Number of days after which objects expire */
  expirationInDays?: number
  /** Number of days after which noncurrent object versions expire */
  noncurrentVersionExpirationInDays?: number
}

/**
 * Properties for configuring an AWS S3 bucket.
 * @see [CDK S3 Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_s3-readme.html}
 */
/** @category Interface */
export interface S3BucketProps extends s3.BucketProps {
  /** The name of the S3 bucket */
  bucketName: string
  /** Whether to enable EventBridge notifications for bucket events */
  enableEventBridge?: boolean
  /** Whether to reference an existing bucket rather than creating a new one */
  existingBucket?: boolean
  /** Lifecycle rules for objects in the bucket */
  lifecycleRules?: LifecycleRule[]
  /** Name of an existing bucket to use for server access logging */
  logBucketName?: string
  /** Tags to apply to the bucket */
  tags?: TagProps[]
}
