import { Duration, RemovalPolicy, Tags } from 'aws-cdk-lib'
import { IQueue, Queue } from 'aws-cdk-lib/aws-sqs'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { LambdaProps } from '../lambda'
import { QueueProps } from './types'

/**
 * @classdesc Provides operations on AWS Simple Queue Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
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
  public createQueue(id: string, scope: CommonConstruct, props: QueueProps, deadLetterQueue?: IQueue) {
    if (!props) throw `Queue props undefined for ${id}`
    if (!props.queueName) throw `Queue queueName undefined for ${id}`

    let queueName = scope.resourceNameFormatter(props.queueName, props.resourceNameOptions)
    if (props.fifo) queueName += '.fifo'

    const queue = new Queue(scope, id, {
      ...props,
      dataKeyReuse: props.dataKeyReuseInSecs ? Duration.seconds(props.dataKeyReuseInSecs) : props.dataKeyReuse,
      deadLetterQueue: !deadLetterQueue
        ? undefined
        : {
            maxReceiveCount: props.maxReceiveCount ?? 5,
            queue: deadLetterQueue,
          },
      deliveryDelay: props.deliveryDelayInSecs ? Duration.seconds(props.deliveryDelayInSecs) : undefined,
      queueName,
      receiveMessageWaitTime: props.receiveMessageWaitTimeInSecs
        ? Duration.seconds(props.receiveMessageWaitTimeInSecs)
        : props.receiveMessageWaitTime,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
      retentionPeriod: props.retentionInDays ? Duration.days(props.retentionInDays) : Duration.days(7),
      visibilityTimeout: props.visibilityTimeoutInSecs
        ? Duration.seconds(props.visibilityTimeoutInSecs)
        : props.visibilityTimeout,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(queue).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-queueArn`, scope, queue.queueArn)
    createCfnOutput(`${id}-queueName`, scope, queue.queueName)
    createCfnOutput(`${id}-queueUrl`, scope, queue.queueUrl)

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
      queueName: `${props.functionName}-redriveq`,
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
    deadLetterQueue: IQueue
  ) {
    let queueProps
    if (props.dlq) {
      queueProps = {
        ...props.dlq,
        queueName: `${props.functionName}-dlq`,
      }
    } else {
      queueProps = {
        queueName: `${props.functionName}-dlq`,
      }
    }

    return this.createQueue(`${id}`, scope, queueProps, deadLetterQueue)
  }
}
