import {
  GetQueueOutputArgs,
  NamespaceArgs,
  QueueArgs,
  SubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/servicebus/index.js'

/**
 * Properties for creating a Service Bus namespace
 * @see [Pulumi Azure Native Service Bus Namespace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/namespace/}
 * @category Interface
 */
export interface ServiceBusNamespaceProps extends NamespaceArgs {}

/**
 * Properties for creating a Service Bus topic
 * @see [Pulumi Azure Native Service Bus Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/topic/}
 * @category Interface
 */
export interface ServiceBusTopicProps extends TopicArgs {}

/**
 * Properties for creating a Service Bus queue
 * @see [Pulumi Azure Native Service Bus Queue]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/queue/}
 * @category Interface
 */
export interface ServiceBusQueueProps extends QueueArgs {}

/**
 * Properties for creating a Service Bus subscription
 * @see [Pulumi Azure Native Service Bus Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/subscription/}
 * @category Interface
 */
export interface ServiceBusSubscriptionProps extends SubscriptionArgs {}

/**
 * Properties for resolving an existing Service Bus queue
 * @see [Pulumi Azure Native Service Bus Queue]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/queue/}
 * @category Interface
 */
export interface ResolveServicebusQueueProps extends GetQueueOutputArgs {}
