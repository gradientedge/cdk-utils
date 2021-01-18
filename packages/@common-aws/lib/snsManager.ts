import * as lambda from '@aws-cdk/aws-lambda'
import * as sns from '@aws-cdk/aws-sns'
import * as subs from '@aws-cdk/aws-sns-subscriptions'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface SubscriptionProps extends sns.TopicProps {
  key: string
}

export class SnsManager {
  public createNotificationService(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    lambdaFunction: lambda.Function
  ) {
    if (!props.subscriptions || props.subscriptions.length == 0)
      throw `subscription props undefined`

    const subscriptionProps = props.subscriptions.find(
      (subscription: SubscriptionProps) => subscription.key === key
    )
    if (!subscriptionProps) throw `Could not find subscription props for key:${key}`

    const topic = new sns.Topic(scope, id, {
      displayName: `${subscriptionProps.topicName}-${props.stage}`,
      topicName: `${subscriptionProps.topicName}-${props.stage}`,
    })

    topic.addSubscription(new subs.LambdaSubscription(lambdaFunction))

    createCfnOutput(`${id}Arn`, scope, topic.topicArn)
    createCfnOutput(`${id}Name`, scope, topic.topicName)

    return topic
  }
}
