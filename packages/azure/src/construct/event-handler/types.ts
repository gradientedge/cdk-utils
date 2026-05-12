import { EventSubscription } from '@pulumi/azure-native/eventgrid/index.js'
import { GetNamespaceResult, GetQueueResult, Namespace, Queue } from '@pulumi/azure-native/servicebus/index.js'
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
 * Properties for configuring the Service Bus integration in the event handler
 * @category Interface
 */
export interface EventHandlerServiceBusProps {
  /** Service Bus namespace properties */
  namespace?: ServiceBusNamespaceProps
  /** Service Bus queue properties */
  queue?: ServiceBusQueueProps
  /** When true, resolves an existing Service Bus instead of creating a new one */
  useExisting?: boolean
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
