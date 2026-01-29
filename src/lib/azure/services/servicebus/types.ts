import {
  GetQueueOutputArgs,
  NamespaceArgs,
  QueueArgs,
  SubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/servicebus/index.js'

export interface ServicebusNamespaceProps extends NamespaceArgs {}

export interface ServicebusTopicProps extends TopicArgs {}

export interface ServicebusQueueProps extends QueueArgs {}

export interface ServicebusSubscriptionProps extends SubscriptionArgs {}

export interface ResolveServicebusQueueProps extends GetQueueOutputArgs {}
