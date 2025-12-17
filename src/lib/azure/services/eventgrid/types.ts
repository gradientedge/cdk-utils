import { EventgridEventSubscriptionConfig } from '@cdktf/provider-azurerm/lib/eventgrid-event-subscription/index.js'
import { EventgridSystemTopicEventSubscriptionConfig } from '@cdktf/provider-azurerm/lib/eventgrid-system-topic-event-subscription/index.js'
import { EventgridSystemTopicConfig } from '@cdktf/provider-azurerm/lib/eventgrid-system-topic/index.js'
import { EventgridTopicConfig } from '@cdktf/provider-azurerm/lib/eventgrid-topic/index.js'

export interface EventgridTopicProps extends EventgridTopicConfig {}

export interface EventgridEventSubscriptionProps extends EventgridEventSubscriptionConfig {}

export interface EventgridSystemTopicProps extends EventgridSystemTopicConfig {}

export interface EventgridSystemTopicEventSubscriptionProps extends EventgridSystemTopicEventSubscriptionConfig {}
