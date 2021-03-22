import * as lambda from '@aws-cdk/aws-lambda'
import * as sns from '@aws-cdk/aws-sns'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import { CommonConstruct } from './commonConstruct'
import { SubscriptionProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
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
 * @see [CDK Simple Notification Service Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-sns-readme.html}</li></i>
 */
export class SnsManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string[]} emails
   */
  public createEmailNotificationService(id: string, scope: CommonConstruct, emails: string[]) {
    if (!scope.props.subscriptions || scope.props.subscriptions.length == 0)
      throw `subscription props undefined`

    const subscriptionProps = scope.props.subscriptions.find(
      (subscription: SubscriptionProps) => subscription.id === id
    )
    if (!subscriptionProps) throw `Could not find subscription props for id:${id}`

    const topic = new sns.Topic(scope, id, {
      displayName: `${subscriptionProps.topicName}-${scope.props.stage}`,
      topicName: `${subscriptionProps.topicName}-${scope.props.stage}`,
      fifo: subscriptionProps.fifo,
    })

    if (emails && emails.length > 0) {
      emails.forEach((email: string) => topic.addSubscription(new subs.EmailSubscription(email)))
    }

    createCfnOutput(`${id}Arn`, scope, topic.topicArn)
    createCfnOutput(`${id}Name`, scope, topic.topicName)

    return topic
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {lambda.Function} lambdaFunction
   */
  public createLambdaNotificationService(
    id: string,
    scope: CommonConstruct,
    lambdaFunction: lambda.Function
  ) {
    if (!scope.props.subscriptions || scope.props.subscriptions.length == 0)
      throw `subscription props undefined`

    const subscriptionProps = scope.props.subscriptions.find(
      (subscription: SubscriptionProps) => subscription.id === id
    )
    if (!subscriptionProps) throw `Could not find subscription props for id:${id}`

    const topic = new sns.Topic(scope, id, {
      displayName: `${subscriptionProps.topicName}-${scope.props.stage}`,
      topicName: `${subscriptionProps.topicName}-${scope.props.stage}`,
      fifo: subscriptionProps.fifo,
    })

    topic.addSubscription(new subs.LambdaSubscription(lambdaFunction))

    createCfnOutput(`${id}Arn`, scope, topic.topicArn)
    createCfnOutput(`${id}Name`, scope, topic.topicName)

    return topic
  }
}
