import { QueueProps } from 'aws-cdk-lib/aws-sqs'
import { SqsToLambdaPipeProps, SqsToSfnPipeProps } from '../../services/index.js'
import { EventHandlerProps } from '../event-handler/index.js'

export interface PipedEventHandlerProps extends EventHandlerProps {
  pipedDlq: QueueProps
  pipedQueue: QueueProps
  sqsToLambdaPipe: SqsToLambdaPipeProps
  sqsToSfnPipe: SqsToSfnPipeProps
}
