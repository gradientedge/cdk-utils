import { EventgridTopicConfig } from '@cdktf/provider-azurerm/lib/eventgrid-topic'
import { EventgridEventSubscriptionConfig } from '@cdktf/provider-azurerm/lib/eventgrid-event-subscription'

export interface EventgridTopicProps extends EventgridTopicConfig {}

export interface EventgridEventSubscriptionProps extends EventgridEventSubscriptionConfig {}
