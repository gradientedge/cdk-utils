import * as sqs from 'aws-cdk-lib/aws-sqs'
import { TagProps } from '../../../types'

/**
 */
export interface QueueProps extends sqs.QueueProps {
  dataKeyReuseInSecs?: number
  deliveryDelayInSecs?: number
  maxReceiveCount?: number
  receiveMessageWaitTimeInSecs?: number
  retentionInDays?: number
  retriesEnabled?: boolean
  retryBatchSize?: number
  tags?: TagProps[]
  visibilityTimeoutInSecs?: number
}
