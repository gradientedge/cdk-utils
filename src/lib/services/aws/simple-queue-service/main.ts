import * as cdk from 'aws-cdk-lib'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import { QueueProps } from './types'
import { LambdaProps } from '../lambda'

/**
 * @classdesc Provides operations on AWS Simple Queue Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.sqsManager.createQueue('MySqs', this, {...})
 *   }
 * }
 * @see [CDK Simple Queue Service Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sqs-readme.html}
 */
export class SqsManager {
  /**
   * @summary Method to create a lambda queue service
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param deadLetterQueue
   */
  public createQueue(id: string, scope: CommonConstruct, props: QueueProps, deadLetterQueue?: sqs.IQueue) {
    if (!props) throw `Queue props undefined for ${id}`

    const queue = new sqs.Queue(scope, id, {
      contentBasedDeduplication: props.contentBasedDeduplication,
      dataKeyReuse: props.dataKeyReuseInSecs ? cdk.Duration.seconds(props.dataKeyReuseInSecs) : props.dataKeyReuse,
      deadLetterQueue: !deadLetterQueue
        ? undefined
        : {
            maxReceiveCount: props.maxReceiveCount ?? 5,
            queue: deadLetterQueue,
          },
      deduplicationScope: props.deduplicationScope,
      deliveryDelay: props.deliveryDelayInSecs ? cdk.Duration.seconds(props.deliveryDelayInSecs) : undefined,
      encryption: props.encryption,
      encryptionMasterKey: props.encryptionMasterKey,
      fifo: props.fifo,
      fifoThroughputLimit: props.fifoThroughputLimit,
      maxMessageSizeBytes: props.maxMessageSizeBytes,
      queueName: props.queueName,
      receiveMessageWaitTime: props.receiveMessageWaitTimeInSecs
        ? cdk.Duration.seconds(props.receiveMessageWaitTimeInSecs)
        : props.receiveMessageWaitTime,
      removalPolicy: props.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
      retentionPeriod: props.retentionInDays ? cdk.Duration.days(props.retentionInDays) : cdk.Duration.days(7),
      visibilityTimeout: props.visibilityTimeoutInSecs
        ? cdk.Duration.seconds(props.visibilityTimeoutInSecs)
        : props.visibilityTimeout,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(queue).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-queueArn`, scope, queue.queueArn)
    utils.createCfnOutput(`${id}-queueName`, scope, queue.queueName)
    utils.createCfnOutput(`${id}-queueUrl`, scope, queue.queueUrl)

    return queue
  }

  /**
   * @summary Method to create a redrive queue for a lambda function
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the lambda properties
   */
  public createRedriveQueueForLambda(id: string, scope: CommonConstruct, props: LambdaProps) {
    return this.createQueue(`${id}`, scope, {
      ...props.redriveq,
      queueName: props.redriveq?.fifo
        ? `${props.functionName}-redriveq-${scope.props.stage}.fifo`
        : `${props.functionName}-redriveq-${scope.props.stage}`,
    })
  }

  /**
   * @summary Method to create a dead letter queue for a lambda function
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the lambda properties
   * @param deadLetterQueue
   */
  public createDeadLetterQueueForLambda(
    id: string,
    scope: CommonConstruct,
    props: LambdaProps,
    deadLetterQueue: sqs.IQueue
  ) {
    let queueProps
    if (props.dlq) {
      queueProps = {
        ...props.dlq,
        queueName: props.dlq.fifo
          ? `${props.functionName}-dlq-${scope.props.stage}.fifo`
          : `${props.functionName}-dlq-${scope.props.stage}`,
      }
    } else {
      queueProps = {
        queueName: `${props.functionName}-dlq-${scope.props.stage}`,
      }
    }

    return this.createQueue(`${id}`, scope, queueProps, deadLetterQueue)
  }
}
