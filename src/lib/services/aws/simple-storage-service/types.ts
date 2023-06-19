import { TagProps } from '../../../types'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'

/**
 * @category cdk-utils.s3-manager
 * @subcategory Properties
 */
export interface LifecycleRule extends s3.LifecycleRule {
  expirationInDays?: number
  noncurrentVersionExpirationInDays?: number
}

/**
 * @category cdk-utils.s3-manager
 * @subcategory Properties
 */
export interface BucketDeploymentProps extends s3deploy.BucketDeploymentProps {
  expirationInDays?: number
  noncurrentVersionExpirationInDays?: number
}

/**
 * @category cdk-utils.s3-manager
 * @subcategory Properties
 */
export interface S3BucketProps extends s3.BucketProps {
  enableEventBridge?: boolean
  lifecycleRules?: LifecycleRule[]
  bucketName: string
  logBucketName?: string
  existingBucket?: boolean
  tags?: TagProps[]
}
