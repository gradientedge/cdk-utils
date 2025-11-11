import { ServicebusNamespaceConfig } from '@cdktf/provider-azurerm/lib/servicebus-namespace'
import { ServicebusTopicConfig } from '@cdktf/provider-azurerm/lib/servicebus-topic'
import { ServicebusQueueConfig } from '@cdktf/provider-azurerm/lib/servicebus-queue'
import { ServicebusSubscriptionConfig } from '@cdktf/provider-azurerm/lib/servicebus-subscription'
import { DataAzurermServicebusQueueConfig } from '@cdktf/provider-azurerm/lib/data-azurerm-servicebus-queue'

export interface ServicebusNamespaceProps extends ServicebusNamespaceConfig {}
export interface ServicebusTopicProps extends ServicebusTopicConfig {}
export interface ServicebusQueueProps extends ServicebusQueueConfig {}
export interface ServicebusSubscriptionProps extends ServicebusSubscriptionConfig {}
export interface DataAzurermServicebusQueueProps extends DataAzurermServicebusQueueConfig {}
