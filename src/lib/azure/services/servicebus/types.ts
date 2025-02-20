import { ServicebusTopicConfig } from '@cdktf/provider-azurerm/lib/servicebus-topic'
import { ServicebusSubscriptionConfig } from '@cdktf/provider-azurerm/lib/servicebus-subscription'

export interface ServicebusTopicProps extends ServicebusTopicConfig {}
export interface ServicebusSubscriptionProps extends ServicebusSubscriptionConfig {}
