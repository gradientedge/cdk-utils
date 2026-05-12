import * as sqs from 'aws-cdk-lib/aws-sqs'

import { TagProps } from '../../types/index.js'

/**
 * Properties for configuring an AWS SQS queue.
 * @see [CDK SQS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sqs-readme.html}
 */
/** @category Interface */
export interface QueueProps extends sqs.QueueProps {
  /** Duration in seconds for which the data key is reused before calling KMS again */
  dataKeyReuseInSecs?: number
  /** Delay in seconds before messages become visible after being sent */
  deliveryDelayInSecs?: number
  /** Maximum number of times a message can be received before being sent to the dead letter queue */
  maxReceiveCount?: number
  /** Duration in seconds for which a receive call waits for a message to arrive */
  receiveMessageWaitTimeInSecs?: number
  /** Number of days the queue retains messages */
  retentionInDays?: number
  /** Whether retries are enabled for the dead letter queue */
  retriesEnabled?: boolean
  /** Batch size for retry processing from the dead letter queue */
  retryBatchSize?: number
  /** Tags to apply to the queue */
  tags?: TagProps[]
  /** Duration in seconds that a received message is hidden from subsequent receive requests */
  visibilityTimeoutInSecs?: number
}
