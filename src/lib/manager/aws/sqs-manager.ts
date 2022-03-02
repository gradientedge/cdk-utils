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
 *     this.sqsManager.createSqsQueue('MySqs', this)
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
   * @param {sqs.deadLetterQueue} deadLetterQueue
   */
  public createQueueService(
    id: string,
    scope: common.CommonConstruct,
    props: types.QueueProps,
    deadLetterQueue?: sqs.DeadLetterQueue
  ) {
    if (!props) throw `Queue props undefined`

    const queue = new sqs.Queue(scope, id, {
      queueName: props.queueName,
      visibilityTimeout: cdk.Duration.seconds(props.visibilityTimeoutInSecs),
      receiveMessageWaitTime: cdk.Duration.seconds(props.receiveMessageWaitTimeInSecs),
      contentBasedDeduplication: props.contentBasedDeduplication,
      dataKeyReuse: cdk.Duration.seconds(props.dataKeyReuseInSecs),
      deadLetterQueue: deadLetterQueue,
      deduplicationScope: props.deduplicationScope,
      deliveryDelay: cdk.Duration.seconds(props.deliveryDelayInSecs),
      encryption: props.encryption,
      encryptionMasterKey: props.encryptionMasterKey,
      fifo: props.fifo,
      fifoThroughputLimit: props.fifoThroughputLimit,
      maxMessageSizeBytes: props.maxMessageSizeBytes,
      removalPolicy: props.removalPolicy,
      retentionPeriod: props.retentionPeriod,
    })

    utils.createCfnOutput(`${id}-queueArn`, scope, queue.queueArn)
    utils.createCfnOutput(`${id}-queueName`, scope, queue.queueName)
    utils.createCfnOutput(`${id}-queueUrl`, scope, queue.queueUrl)

    return queue
  }
}
