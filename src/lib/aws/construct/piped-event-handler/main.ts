import { SqsQueue } from 'aws-cdk-lib/aws-events-targets'
import { IQueue } from 'aws-cdk-lib/aws-sqs'
import { Construct } from 'constructs'
import _ from 'lodash'
import { EventHandler } from '../event-handler'
import { PipedEventHandlerProps } from './types'

/**
 * @classdesc Provides a construct to create and deploy an EventBridge Piped Event Handler
 * @example
 * import { PipedEventHandler, PipedEventHandlerProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends PipedEventHandler {
 *   constructor(parent: Construct, id: string, props: PipedEventHandlerProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class PipedEventHandler extends EventHandler {
  props: PipedEventHandlerProps
  pipedDlq: IQueue
  pipedQueue: IQueue

  protected constructor(parent: Construct, id: string, props: PipedEventHandlerProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
    this.useMapState = true
    this.provisionTarget = false
  }

  protected initResources() {
    this.createPipedQueue()
    this.handler.sqsTargets = [new SqsQueue(this.pipedQueue)]
    super.initResources()
    this.createSqsToSfnPipe()
    this.createSqsToLambdaPipe()
  }

  /**
   * @summary Method to create the piped queue and dlq.
   */
  protected createPipedQueue() {
    this.pipedDlq = this.sqsManager.createQueue(`${this.id}-pipe-queue-dlq`, this, this.props.pipedDlq)
    this.pipedQueue = this.sqsManager.createQueue(`${this.id}-pipe-queue`, this, this.props.pipedQueue, this.pipedDlq)
  }

  /**
   * @summary Method to create the SQS to SFN pipe.
   */
  protected createSqsToSfnPipe() {
    if (_.isEmpty(this.props.sqsToSfnPipe) || !this.handler.workflow) return
    this.eventManager.createSqsToSfnCfnPipe(
      `${this.id}-pipe-sfn`,
      this,
      this.props.sqsToSfnPipe,
      this.pipedQueue,
      this.handler.workflow
    )
  }

  /**
   * @summary Method to create the SQS to Lambda pipe.
   */
  protected createSqsToLambdaPipe() {
    if (_.isEmpty(this.props.sqsToLambdaPipe) || _.isEmpty(this.handler.lambdaFunctions)) return
    _.forEach(this.handler.lambdaFunctions, (lambdaFunction, index) => {
      this.eventManager.createSqsToLambdaCfnPipe(
        `${this.id}-pipe-lambda-${index}`,
        this,
        this.props.sqsToLambdaPipe,
        this.pipedQueue,
        lambdaFunction
      )
    })
  }
}
