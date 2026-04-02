import {
  GetQueueOutputArgs,
  NamespaceArgs,
  QueueArgs,
  SubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/servicebus/index.js'

/** @category Interface */
export interface ServiceBusNamespaceProps extends NamespaceArgs {}

/** @category Interface */
export interface ServiceBusTopicProps extends TopicArgs {}

/** @category Interface */
export interface ServiceBusQueueProps extends QueueArgs {}

/** @category Interface */
export interface ServiceBusSubscriptionProps extends SubscriptionArgs {}

/** @category Interface */
export interface ResolveServicebusQueueProps extends GetQueueOutputArgs {}
