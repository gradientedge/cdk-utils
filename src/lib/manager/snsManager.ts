import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as sns from 'aws-cdk-lib/aws-sns'
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions'
import { CommonConstruct } from '../common/commonConstruct'
import { SubscriptionProps } from '../types'
import { createCfnOutput } from '../utils'

/**
 * @stability stable
 * @category Application Integration
 * @summary Provides operations on AWS Simple Notification Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.snsManager.createEmailNotificationService('MySns', 'eu-west-1', ['test@example.com'])
 * }
 *
 * @see [CDK Simple Notification Service Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-sns-readme.html}
 */
export class SnsManager {
  /**
   * @summary Method to create an email notification service
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SubscriptionProps} props
   * @param {string[]} emails
   */
  public createEmailNotificationService(
    id: string,
    scope: CommonConstruct,
    props: SubscriptionProps,
    emails: string[]
  ) {
    if (!props) throw `subscription props undefined`

    const topic = new sns.Topic(scope, id, {
      displayName: `${props.topicName}-${scope.props.stage}`,
      topicName: `${props.topicName}-${scope.props.stage}`,
      fifo: props.fifo,
    })

    if (emails && emails.length > 0) {
      emails.forEach((email: string) => topic.addSubscription(new subs.EmailSubscription(email)))
    }

    createCfnOutput(`${id}-subscriptionArn`, scope, topic.topicArn)
    createCfnOutput(`${id}-subscriptionName`, scope, topic.topicName)

    return topic
  }

  /**
   * @summary Method to create a lambda notification service
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {SubscriptionProps} props
   * @param {lambda.Function} lambdaFunction
   */
  public createLambdaNotificationService(
    id: string,
    scope: CommonConstruct,
    props: SubscriptionProps,
    lambdaFunction: lambda.Function
  ) {
    if (!props) throw `subscription props undefined`

    const topic = new sns.Topic(scope, id, {
      displayName: `${props.topicName}-${scope.props.stage}`,
      topicName: `${props.topicName}-${scope.props.stage}`,
      fifo: props.fifo,
    })

    topic.addSubscription(new subs.LambdaSubscription(lambdaFunction))

    createCfnOutput(`${id}-subscriptionArn`, scope, topic.topicArn)
    createCfnOutput(`${id}-subscriptionName`, scope, topic.topicName)

    return topic
  }
}