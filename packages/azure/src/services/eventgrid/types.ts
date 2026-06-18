import {
  EventSubscriptionArgs,
  GetSystemTopicOutputArgs,
  GetTopicOutputArgs,
  SystemTopicArgs,
  SystemTopicEventSubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/eventgrid/index.js'

/**
 * Properties for creating an EventGrid topic
 * @see [Pulumi Azure Native Event Grid Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/topic/}
 * @category Interface
 */
export interface EventgridTopicProps extends TopicArgs {}

/**
 * Properties for creating an EventGrid event subscription
 * @see [Pulumi Azure Native Event Grid Event Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/eventsubscription/}
 * @category Interface
 */
export interface EventgridEventSubscriptionProps extends EventSubscriptionArgs {}

/**
 * Properties for creating an EventGrid system topic
 * @see [Pulumi Azure Native Event Grid System Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/systemtopic/}
 * @category Interface
 */
export interface EventgridSystemTopicProps extends SystemTopicArgs {}

/**
 * Properties for creating an EventGrid system topic event subscription
 * @see [Pulumi Azure Native Event Grid System Topic Event Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/systemtopiceventsubscription/}
 * @category Interface
 */
export interface EventgridSystemTopicEventSubscriptionProps extends SystemTopicEventSubscriptionArgs {}

/**
 * Properties for resolving an existing EventGrid topic
 * @see [Pulumi Azure Native Event Grid Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/topic/}
 * @category Interface
 */
export interface ResolveEventgridTopicProps extends GetTopicOutputArgs {}

/**
 * Properties for resolving an existing EventGrid system topic
 * @see [Pulumi Azure Native Event Grid System Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/systemtopic/}
 * @category Interface
 */
export interface ResolveEventgridSystemTopicProps extends GetSystemTopicOutputArgs {}
