import { EventSubscription } from '@pulumi/azure-native/eventgrid/index.js'
import {
  GetNamespaceResult,
  GetQueueResult,
  Namespace,
  Queue,
  QueueAuthorizationRule,
} from '@pulumi/azure-native/servicebus/index.js'
import { BlobContainer, StorageAccount } from '@pulumi/azure-native/storage/index.js'
import { Input, Output } from '@pulumi/pulumi'

import {
  DefenderForStorageProps,
  EventgridEventSubscriptionProps,
  EventgridTopicProps,
  ServiceBusNamespaceProps,
  ServiceBusQueueProps,
  StorageAccountProps,
  StorageContainerProps,
} from '../../services/index.js'
import { AzureFunctionAppProps } from '../function-app/index.js'

/**
 * Properties for the EventGrid subscription dead-letter queue storage
 * @category Interface
 */
export interface EventHandlerEventGridSubscriptionProps {
  /** Storage account properties for the dead-letter queue */
  dlqStorageAccount: StorageAccountProps
  /** Storage container properties for the dead-letter queue */
  dlqStorageContainer: StorageContainerProps
}

/**
 * Provisioned EventGrid subscription resources including dead-letter storage
 * @category Interface
 */
export interface EventHandlerEventGridSubscription {
  /** The provisioned dead-letter queue storage account */
  dlqStorageAccount?: StorageAccount
  /** The provisioned dead-letter queue storage container */
  dlqStorageContainer?: BlobContainer
  /** The provisioned EventGrid event subscription */
  eventSubscription?: EventSubscription
}

/**
 * Properties for configuring the Service Bus namespace inside the event handler.
 * Wraps {@link ServiceBusNamespaceProps} with a `useExisting` flag controlling
 * whether the construct creates the namespace or resolves an existing one.
 * @category Interface
 */
export interface EventHandlerServiceBusNamespaceProps extends ServiceBusNamespaceProps {
  /** When true, resolves an existing namespace via getNamespaceOutput instead of creating one */
  useExisting?: boolean
}

/**
 * Properties for configuring the Service Bus queue inside the event handler.
 * Wraps {@link ServiceBusQueueProps} with a `useExisting` flag controlling
 * whether the construct creates the queue or resolves an existing one.
 * @category Interface
 */
export interface EventHandlerServiceBusQueueProps extends ServiceBusQueueProps {
  /** When true, resolves an existing queue via getQueueOutput instead of creating one */
  useExisting?: boolean
}

/**
 * Properties for configuring the Service Bus integration in the event handler.
 *
 * `namespace.useExisting` and `queue.useExisting` are independent. The supported combinations are:
 * - `namespace.useExisting=false, queue.useExisting=false` — create both (default)
 * - `namespace.useExisting=true,  queue.useExisting=false` — reuse an existing (e.g. shared) namespace, create a new queue under it
 * - `namespace.useExisting=true,  queue.useExisting=true`  — reuse both (cross-stack reference to a queue someone else owns)
 * - `namespace.useExisting=false, queue.useExisting=true`  — invalid; construct throws at construct-time
 * @category Interface
 */
export interface EventHandlerServiceBusProps {
  /** Service Bus namespace properties (extends {@link ServiceBusNamespaceProps} with `useExisting`) */
  namespace?: EventHandlerServiceBusNamespaceProps
  /** Service Bus queue properties (extends {@link ServiceBusQueueProps} with `useExisting`) */
  queue?: EventHandlerServiceBusQueueProps
}

/**
 * Provisioned Service Bus resources for the event handler
 * @category Interface
 */
export interface EventHandlerServiceBus {
  /** The provisioned or resolved Service Bus namespace */
  namespace: Namespace | Output<GetNamespaceResult>
  /** The provisioned or resolved Service Bus queue */
  queue: Queue | Output<GetQueueResult>
  /**
   * Per-queue authorization rule (Listen+Send) used to build the function app's
   * `EVENT_INGEST_SERVICE_BUS` connection string. Provisioned only when the
   * construct owns the queue (`queue.useExisting=false`); undefined when the
   * queue is external and the connection string falls back to the namespace-level rule.
   */
  queueAuthorizationRule?: QueueAuthorizationRule
}

/**
 * Properties for configuring the EventGrid topic in the event handler
 * @category Interface
 */
export interface EventHandlerEventGridTopicProps extends EventgridTopicProps {
  /** When true, resolves an existing EventGrid topic instead of creating a new one */
  useExistingTopic: boolean
  /** Subscription ID of the existing EventGrid topic (for cross-subscription access) */
  existingSubscriptionId?: string
  /** Name of the existing EventGrid topic to resolve */
  existingTopicName?: string
  /** Resource group name of the existing EventGrid topic */
  existingResourceGroupName?: Input<string>
}

/**
 * Properties for the {@link AzureEventHandler} construct
 * @category Interface
 */
export interface AzureEventHandlerProps extends AzureFunctionAppProps {
  /** Microsoft Defender for Storage configuration */
  defender?: DefenderForStorageProps
  /** EventGrid event subscription properties */
  eventGridEventSubscription?: EventgridEventSubscriptionProps
  /** EventGrid subscription dead-letter queue storage properties */
  eventGridSubscription: EventHandlerEventGridSubscriptionProps
  /** EventGrid topic properties */
  eventGridTopic: EventHandlerEventGridTopicProps
  /** Service Bus integration properties */
  serviceBus?: EventHandlerServiceBusProps
}
