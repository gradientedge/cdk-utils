import { IFunction } from 'aws-cdk-lib/aws-lambda'
import { Topic } from 'aws-cdk-lib/aws-sns'
import { EmailSubscription, LambdaSubscription } from 'aws-cdk-lib/aws-sns-subscriptions'
import _ from 'lodash'
import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'
import { SubscriptionProps } from './types.js'

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
    if (!props.topicName) throw `Subscription topicName undefined for ${id}`

    const topic = new Topic(scope, id, {
      ...props,
      displayName: scope.resourceNameFormatter.format(props.topicName, scope.props.resourceNameOptions?.sns),
      topicName: scope.resourceNameFormatter.format(props.topicName, scope.props.resourceNameOptions?.sns),
    })

    if (emails && !_.isEmpty(emails)) {
      _.forEach(emails, (email: string) => topic.addSubscription(new EmailSubscription(email)))
    }

    createCfnOutput(`${id}-subscriptionArn`, scope, topic.topicArn)
    createCfnOutput(`${id}-subscriptionName`, scope, topic.topicName)

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
    lambdaFunction: IFunction
  ) {
    if (!props) throw `Subscription props undefined for ${id}`
    if (!props.topicName) throw `Subscription topicName undefined for ${id}`

    const topic = new Topic(scope, id, {
      ...props,
      displayName: scope.resourceNameFormatter.format(props.topicName, scope.props.resourceNameOptions?.sns),
      topicName: scope.resourceNameFormatter.format(props.topicName, scope.props.resourceNameOptions?.sns),
    })

    topic.addSubscription(new LambdaSubscription(lambdaFunction))

    createCfnOutput(`${id}-subscriptionArn`, scope, topic.topicArn)
    createCfnOutput(`${id}-subscriptionName`, scope, topic.topicName)

    return topic
  }
}
