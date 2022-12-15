import * as cdk from 'aws-cdk-lib'
import * as sqs from 'aws-cdk-lib/aws-sqs'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.sqs-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Simple Queue Service.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.sqsManager.createQueue('MySqs', this, {...})
 *   }
 * }
 *
 * @see [CDK Simple Queue Service Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sqs-readme.html}
 */
export class SqsManager {
  /**
   * @summary Method to create a lambda queue service
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.QueueProps} props
   * @param {sqs.IQueue} deadLetterQueue
   */
  public createQueue(id: string, scope: common.CommonConstruct, props: types.QueueProps, deadLetterQueue?: sqs.IQueue) {
    if (!props) throw `Queue props undefined`

    const queue = new sqs.Queue(scope, id, {
      queueName: props.queueName,
      visibilityTimeout: props.visibilityTimeoutInSecs
        ? cdk.Duration.seconds(props.visibilityTimeoutInSecs)
        : props.visibilityTimeout,
      receiveMessageWaitTime: props.receiveMessageWaitTimeInSecs
        ? cdk.Duration.seconds(props.receiveMessageWaitTimeInSecs)
        : props.receiveMessageWaitTime,
      contentBasedDeduplication: props.contentBasedDeduplication,
      dataKeyReuse: props.dataKeyReuseInSecs ? cdk.Duration.seconds(props.dataKeyReuseInSecs) : props.dataKeyReuse,
      deadLetterQueue: !deadLetterQueue
        ? undefined
        : {
            queue: deadLetterQueue,
            maxReceiveCount: props.maxReceiveCount ?? 5,
          },
      deduplicationScope: props.deduplicationScope,
      deliveryDelay: props.deliveryDelayInSecs ? cdk.Duration.seconds(props.deliveryDelayInSecs) : undefined,
      encryption: props.encryption,
      encryptionMasterKey: props.encryptionMasterKey,
      fifo: props.fifo,
      fifoThroughputLimit: props.fifoThroughputLimit,
      maxMessageSizeBytes: props.maxMessageSizeBytes,
      removalPolicy: props.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
      retentionPeriod: props.retentionInDays ? cdk.Duration.days(props.retentionInDays) : cdk.Duration.days(7),
    })

    utils.createCfnOutput(`${id}-queueArn`, scope, queue.queueArn)
    utils.createCfnOutput(`${id}-queueName`, scope, queue.queueName)
    utils.createCfnOutput(`${id}-queueUrl`, scope, queue.queueUrl)

    return queue
  }

  /**
   * @summary Method to create a redrive queue for a lambda function
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaProps} props the lambda properties
   */
  public createRedriveQueueForLambda(id: string, scope: common.CommonConstruct, props: types.LambdaProps) {
    return this.createQueue(`${id}`, scope, {
      ...props.redriveq,
      ...{
        queueName: `${props.functionName}-redriveq-${scope.props.stage}`,
      },
    })
  }

  /**
   * @summary Method to create a dead letter queue for a lambda function
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.LambdaProps} props the lambda properties
   * @param {sqs.IQueue} deadLetterQueue
   */
  public createDeadLetterQueueForLambda(
    id: string,
    scope: common.CommonConstruct,
    props: types.LambdaProps,
    deadLetterQueue: sqs.IQueue
  ) {
    let queueProps
    if (props.dlq) {
      queueProps = {
        ...props.dlq,
        ...{
          queueName: `${props.functionName}-dlq-${scope.props.stage}`,
        },
      }
    } else {
      queueProps = {
        queueName: `${props.functionName}-dlq-${scope.props.stage}`,
      }
    }

    return this.createQueue(`${id}`, scope, queueProps, deadLetterQueue)
  }
}
