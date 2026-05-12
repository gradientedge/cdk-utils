import { QueueProps } from 'aws-cdk-lib/aws-sqs'

import { SqsToLambdaPipeProps, SqsToSfnPipeProps } from '../../services/index.js'
import { EventHandlerProps } from '../event-handler/index.js'

/**
 * Properties for configuring a {@link PipedEventHandler} construct
 */
/** @category Interface */
export interface PipedEventHandlerProps extends EventHandlerProps {
  /** Configuration for the dead-letter queue used by the piped queue */
  pipedDlq: QueueProps
  /** Configuration for the SQS queue used as the event pipe source */
  pipedQueue: QueueProps
  /** Configuration for the SQS-to-Lambda EventBridge pipe */
  sqsToLambdaPipe: SqsToLambdaPipeProps
  /** Configuration for the SQS-to-Step-Functions EventBridge pipe */
  sqsToSfnPipe: SqsToSfnPipeProps
}
