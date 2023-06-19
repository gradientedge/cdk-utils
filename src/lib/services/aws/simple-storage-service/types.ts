import { TagProps } from '../../../types'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'

/**
 */
export interface LifecycleRule extends s3.LifecycleRule {
  expirationInDays?: number
  noncurrentVersionExpirationInDays?: number
}

/**
 */
export interface BucketDeploymentProps extends s3deploy.BucketDeploymentProps {
  expirationInDays?: number
  noncurrentVersionExpirationInDays?: number
}

/**
 */
export interface S3BucketProps extends s3.BucketProps {
  bucketName: string
  enableEventBridge?: boolean
  existingBucket?: boolean
  lifecycleRules?: LifecycleRule[]
  logBucketName?: string
  tags?: TagProps[]
}
