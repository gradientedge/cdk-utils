import { EventgridTopicConfig } from '@cdktf/provider-azurerm/lib/eventgrid-topic'
import { EventgridEventSubscriptionConfig } from '@cdktf/provider-azurerm/lib/eventgrid-event-subscription'
import { EventgridSystemTopicConfig } from '@cdktf/provider-azurerm/lib/eventgrid-system-topic'
import { EventgridSystemTopicEventSubscriptionConfig } from '@cdktf/provider-azurerm/lib/eventgrid-system-topic-event-subscription/index.js'

export interface EventgridTopicProps extends EventgridTopicConfig {}

export interface EventgridEventSubscriptionProps extends EventgridEventSubscriptionConfig {}

export interface EventgridSystemTopicProps extends EventgridSystemTopicConfig {}

export interface EventgridSystemTopicEventSubscriptionProps extends EventgridSystemTopicEventSubscriptionConfig {}
