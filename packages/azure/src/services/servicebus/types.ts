import {
  GetQueueOutputArgs,
  NamespaceArgs,
  QueueArgs,
  SubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/servicebus/index.js'

export interface ServiceBusNamespaceProps extends NamespaceArgs {}

export interface ServiceBusTopicProps extends TopicArgs {}

export interface ServiceBusQueueProps extends QueueArgs {}

export interface ServiceBusSubscriptionProps extends SubscriptionArgs {}

export interface ResolveServicebusQueueProps extends GetQueueOutputArgs {}
