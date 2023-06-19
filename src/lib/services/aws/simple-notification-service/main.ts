import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import { SubscriptionProps } from './types'

/**
 * @classdesc Provides operations on AWS Simple Notification Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.snsManager.createEmailNotificationService('MySns', 'eu-west-1', ["test@example.com"])
 *   }
 * }
 * @see [CDK Simple Notification Service Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_sns-readme.html}
 */
export class SnsManager {
  /**
   * @summary Method to create an email notification service
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param emails
   */
  public createEmailNotificationService(
    id: string,
    scope: CommonConstruct,
    props: SubscriptionProps,
    emails: string[]
  ) {
    if (!props) throw `Subscription props undefined for ${id}`

    const topic = new sns.Topic(scope, id, {
      displayName: `${props.topicName}-${scope.props.stage}`,
      fifo: props.fifo,
      topicName: `${props.topicName}-${scope.props.stage}`,
    })

    if (emails && emails.length > 0) {
      emails.forEach((email: string) => topic.addSubscription(new subs.EmailSubscription(email)))
    }

    utils.createCfnOutput(`${id}-subscriptionArn`, scope, topic.topicArn)
    utils.createCfnOutput(`${id}-subscriptionName`, scope, topic.topicName)

    return topic
  }

  /**
   * @summary Method to create a lambda notification service
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param lambdaFunction
   */
  public createLambdaNotificationService(
    id: string,
    scope: CommonConstruct,
    props: SubscriptionProps,
    lambdaFunction: lambda.IFunction
  ) {
    if (!props) throw `Subscription props undefined for ${id}`

    const topic = new sns.Topic(scope, id, {
      displayName: `${props.topicName}-${scope.props.stage}`,
      fifo: props.fifo,
      topicName: `${props.topicName}-${scope.props.stage}`,
    })

    topic.addSubscription(new subs.LambdaSubscription(lambdaFunction))

    utils.createCfnOutput(`${id}-subscriptionArn`, scope, topic.topicArn)
    utils.createCfnOutput(`${id}-subscriptionName`, scope, topic.topicName)

    return topic
  }
}
