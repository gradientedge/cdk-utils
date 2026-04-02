import { EventSubscription } from '@pulumi/azure-native/eventgrid/index.js'
import { Namespace, Queue } from '@pulumi/azure-native/servicebus/index.js'
import { BlobContainer, StorageAccount } from '@pulumi/azure-native/storage/index.js'

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

export interface EventHandlerEventGridSubscriptionProps {
  dlqStorageAccount: StorageAccountProps
  dlqStorageContainer: StorageContainerProps
}

export interface EventHandlerEventGridSubscription {
  dlqStorageAccount: StorageAccount
  dlqStorageContainer: BlobContainer
  eventSubscription: EventSubscription
}

export interface EventHandlerServiceBusProps {
  namespace: ServiceBusNamespaceProps
  queue: ServiceBusQueueProps
}

export interface EventHandlerServiceBus {
  namespace: Namespace
  queue: Queue
}

export interface EventHandlerEventGridTopicProps extends EventgridTopicProps {
  useExistingTopic: boolean
  existingSubscriptionId?: string
  existingTopicName?: string
  existingResourceGroupName?: string
}

export interface AzureEventHandlerProps extends AzureFunctionAppProps {
  defender?: DefenderForStorageProps
  eventGridEventSubscription: EventgridEventSubscriptionProps
  eventGridSubscription: EventHandlerEventGridSubscriptionProps
  eventGridTopic: EventHandlerEventGridTopicProps
  serviceBus: EventHandlerServiceBusProps
}
