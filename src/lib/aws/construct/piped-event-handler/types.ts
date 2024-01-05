import { QueueProps } from 'aws-cdk-lib/aws-sqs'
import { SqsToLambdaPipeProps, SqsToSfnPipeProps } from '../../services'
import { EventHandlerProps } from '../event-handler'

export interface PipedEventHandlerProps extends EventHandlerProps {
  pipedDlq: QueueProps
  pipedQueue: QueueProps
  sqsToLambdaPipe: SqsToLambdaPipeProps
  sqsToSfnPipe: SqsToSfnPipeProps
}
