import {
  EventSubscriptionArgs,
  GetNamespaceOutputArgs,
  GetNamespaceTopicOutputArgs,
  GetSystemTopicOutputArgs,
  GetTopicOutputArgs,
  NamespaceArgs,
  NamespaceTopicArgs,
  SystemTopicArgs,
  SystemTopicEventSubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/eventgrid/index.js'
import { Input } from '@pulumi/pulumi'

/**
 * Autoscale configuration for an EventGrid namespace.
 * @see [Azure Event Grid namespace autoscale]{@link https://learn.microsoft.com/en-us/azure/event-grid/namespace-enable-autoscale}
 * @category Interface
 */
export interface EventgridNamespaceAutoScaleConfigurationProps {
  enableAutoScale: Input<boolean>
  minimumThroughputUnits?: Input<number>
  maximumThroughputUnits?: Input<number>
}

/**
 * Properties for creating an EventGrid topic
 * @see [Pulumi Azure Native Event Grid Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/topic/}
 * @category Interface
 */
export interface EventgridTopicProps extends TopicArgs {}

/**
 * Properties for creating an EventGrid namespace
 * @see [Pulumi Azure Native Event Grid Namespace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespace/}
 * @category Interface
 */
export interface EventgridNamespaceProps extends NamespaceArgs {
  autoScaleConfiguration?: EventgridNamespaceAutoScaleConfigurationProps
}

/**
 * Properties for creating an EventGrid namespace topic
 * @see [Pulumi Azure Native Event Grid Namespace Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespacetopic/}
 * @category Interface
 */
export interface EventgridNamespaceTopicProps extends NamespaceTopicArgs {}

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
 * Properties for resolving an existing EventGrid namespace
 * @see [Pulumi Azure Native Event Grid Namespace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespace/}
 * @category Interface
 */
export interface ResolveEventgridNamespaceProps extends GetNamespaceOutputArgs {}

/**
 * Properties for resolving an existing EventGrid namespace topic
 * @see [Pulumi Azure Native Event Grid Namespace Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespacetopic/}
 * @category Interface
 */
export interface ResolveEventgridNamespaceTopicProps extends GetNamespaceTopicOutputArgs {}

/**
 * Properties for resolving an existing EventGrid system topic
 * @see [Pulumi Azure Native Event Grid System Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/systemtopic/}
 * @category Interface
 */
export interface ResolveEventgridSystemTopicProps extends GetSystemTopicOutputArgs {}
