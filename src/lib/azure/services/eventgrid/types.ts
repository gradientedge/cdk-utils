import { EventgridTopicConfig } from '@cdktf/provider-azurerm/lib/eventgrid-topic'
import { EventgridEventSubscriptionConfig } from '@cdktf/provider-azurerm/lib/eventgrid-event-subscription'

export interface EventgridTopicProps extends Omit<EventgridTopicConfig, 'name'> {
  name?: string | undefined
}

export interface EventgridEventSubscriptionProps extends EventgridEventSubscriptionConfig {}
