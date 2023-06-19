import * as sqs from 'aws-cdk-lib/aws-sqs'
import { TagProps } from '../../../types'

/**
 * @category cdk-utils.sqs-manager
 * @subcategory Properties
 */
export interface QueueProps extends sqs.QueueProps {
  maxReceiveCount?: number
  visibilityTimeoutInSecs?: number
  receiveMessageWaitTimeInSecs?: number
  dataKeyReuseInSecs?: number
  deliveryDelayInSecs?: number
  retentionInDays?: number
  tags?: TagProps[]
  retriesEnabled?: boolean
  retryBatchSize?: number
}
