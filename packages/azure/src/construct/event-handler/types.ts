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

/** @category Interface */
export interface EventHandlerEventGridSubscriptionProps {
  dlqStorageAccount: StorageAccountProps
  dlqStorageContainer: StorageContainerProps
}

/** @category Interface */
export interface EventHandlerEventGridSubscription {
  dlqStorageAccount?: StorageAccount
  dlqStorageContainer?: BlobContainer
  eventSubscription?: EventSubscription
}

/** @category Interface */
export interface EventHandlerServiceBusProps {
  namespace?: ServiceBusNamespaceProps
  queue?: ServiceBusQueueProps
  useExisting?: boolean
}

/** @category Interface */
export interface EventHandlerServiceBus {
  namespace: Namespace | Output<GetNamespaceResult>
  queue: Queue | Output<GetQueueResult>
}

/** @category Interface */
export interface EventHandlerEventGridTopicProps extends EventgridTopicProps {
  useExistingTopic: boolean
  existingSubscriptionId?: string
  existingTopicName?: string
  existingResourceGroupName?: Input<string>
}

/** @category Interface */
export interface AzureEventHandlerProps extends AzureFunctionAppProps {
  defender?: DefenderForStorageProps
  eventGridEventSubscription?: EventgridEventSubscriptionProps
  eventGridSubscription: EventHandlerEventGridSubscriptionProps
  eventGridTopic: EventHandlerEventGridTopicProps
  serviceBus?: EventHandlerServiceBusProps
}
