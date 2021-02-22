import * as lambda from '@aws-cdk/aws-lambda'
import * as sns from '@aws-cdk/aws-sns'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps, SubscriptionProps } from './types'
import { createCfnOutput } from './genericUtils'

export class SnsManager {
  public createEmailNotificationService(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    emails: string[]
  ) {
    if (!props.subscriptions || props.subscriptions.length == 0)
      throw `subscription props undefined`

    const subscriptionProps = props.subscriptions.find(
      (subscription: SubscriptionProps) => subscription.id === id
    )
    if (!subscriptionProps) throw `Could not find subscription props for id:${id}`

    const topic = new sns.Topic(scope, id, {
      displayName: `${subscriptionProps.topicName}-${props.stage}`,
      topicName: `${subscriptionProps.topicName}-${props.stage}`,
      fifo: subscriptionProps.fifo,
    })

    if (emails && emails.length > 0) {
      emails.forEach((email: string) => topic.addSubscription(new subs.EmailSubscription(email)))
    }

    createCfnOutput(`${id}Arn`, scope, topic.topicArn)
    createCfnOutput(`${id}Name`, scope, topic.topicName)

    return topic
  }

  public createLambdaNotificationService(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    lambdaFunction: lambda.Function
  ) {
    if (!props.subscriptions || props.subscriptions.length == 0)
      throw `subscription props undefined`

    const subscriptionProps = props.subscriptions.find(
      (subscription: SubscriptionProps) => subscription.id === id
    )
    if (!subscriptionProps) throw `Could not find subscription props for id:${id}`

    const topic = new sns.Topic(scope, id, {
      displayName: `${subscriptionProps.topicName}-${props.stage}`,
      topicName: `${subscriptionProps.topicName}-${props.stage}`,
      fifo: subscriptionProps.fifo,
    })

    topic.addSubscription(new subs.LambdaSubscription(lambdaFunction))

    createCfnOutput(`${id}Arn`, scope, topic.topicArn)
    createCfnOutput(`${id}Name`, scope, topic.topicName)

    return topic
  }
}
