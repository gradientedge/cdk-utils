import { ServicebusNamespaceConfig } from '@cdktf/provider-azurerm/lib/servicebus-namespace/index.js'
import { ServicebusTopicConfig } from '@cdktf/provider-azurerm/lib/servicebus-topic/index.js'
import { ServicebusQueueConfig } from '@cdktf/provider-azurerm/lib/servicebus-queue/index.js'
import { ServicebusSubscriptionConfig } from '@cdktf/provider-azurerm/lib/servicebus-subscription/index.js'
import { DataAzurermServicebusQueueConfig } from '@cdktf/provider-azurerm/lib/data-azurerm-servicebus-queue/index.js'

export interface ServicebusNamespaceProps extends ServicebusNamespaceConfig {}
export interface ServicebusTopicProps extends ServicebusTopicConfig {}
export interface ServicebusQueueProps extends ServicebusQueueConfig {}
export interface ServicebusSubscriptionProps extends ServicebusSubscriptionConfig {}
export interface DataAzurermServicebusQueueProps extends DataAzurermServicebusQueueConfig {}
