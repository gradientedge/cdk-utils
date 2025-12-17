import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group/index.js'
import { DataAzurermServicebusQueue } from '@cdktf/provider-azurerm/lib/data-azurerm-servicebus-queue/index.js'
import { ServicebusNamespace } from '@cdktf/provider-azurerm/lib/servicebus-namespace/index.js'
import { ServicebusQueue } from '@cdktf/provider-azurerm/lib/servicebus-queue/index.js'
import { ServicebusSubscription } from '@cdktf/provider-azurerm/lib/servicebus-subscription/index.js'
import { ServicebusTopic } from '@cdktf/provider-azurerm/lib/servicebus-topic/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { createAzureTfOutput } from '../../utils/index.js'
import {
  DataAzurermServicebusQueueProps,
  ServicebusNamespaceProps,
  ServicebusQueueProps,
  ServicebusSubscriptionProps,
  ServicebusTopicProps,
} from './types.js'

/**
 * @classdesc Provides operations on Azure Servicebus
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ServicebusManager.createServicebusTopic('MyServicebusTopic', this, props)
 *   }
 * }
 * ```
 */
export class AzureServicebusManager {
  /**
   * @summary Method to create a new servicebus namespace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props servicebus namespace properties
   * @see [CDKTF Servicebus Namespace Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/servicebusNamespace.typescript.md}
   */
  public createServicebusNamespace(id: string, scope: CommonAzureConstruct, props: ServicebusNamespaceProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-sn-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const servicebusNamespace = new ServicebusNamespace(scope, `${id}-sn`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.serviceBusNamespace),
      resourceGroupName: resourceGroup.name,
      location: resourceGroup.location,
      identity: {
        type: props.identity?.type ?? 'SystemAssigned',
      },
      sku: props.sku ?? 'Standard',
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-servicebusNamespaceName`, scope, servicebusNamespace.name)
    createAzureTfOutput(`${id}-servicebusNamespaceFriendlyUniqueId`, scope, servicebusNamespace.friendlyUniqueId)
    createAzureTfOutput(`${id}-servicebusNamespaceId`, scope, servicebusNamespace.id)

    return servicebusNamespace
  }

  /**
   * @summary Method to create a new servicebus topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props servicebus topic properties
   * @see [CDKTF Servicebus Topic Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/servicebusTopic.typescript.md}
   */
  public createServicebusTopic(id: string, scope: CommonAzureConstruct, props: ServicebusTopicProps) {
    if (!props) throw `Props undefined for ${id}`

    const servicebusTopic = new ServicebusTopic(scope, `${id}-st`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.serviceBusTopic),
      namespaceId: props.namespaceId,
    })

    createAzureTfOutput(`${id}-servicebusTopicName`, scope, servicebusTopic.name)
    createAzureTfOutput(`${id}-servicebusTopicFriendlyUniqueId`, scope, servicebusTopic.friendlyUniqueId)
    createAzureTfOutput(`${id}-servicebusTopicId`, scope, servicebusTopic.id)

    return servicebusTopic
  }

  /**
   * @summary Method to create a new servicebus queue
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props servicebus queue properties
   * @see [CDKTF Servicebus Queue Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/servicebusQueue.typescript.md}
   */
  public createServicebusQueue(id: string, scope: CommonAzureConstruct, props: ServicebusQueueProps) {
    if (!props) throw `Props undefined for ${id}`

    const servicebusQueue = new ServicebusQueue(scope, `${id}-sq`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.serviceBusQueue),
      namespaceId: props.namespaceId,
      duplicateDetectionHistoryTimeWindow: props.duplicateDetectionHistoryTimeWindow ?? 'PT1M',
      requiresDuplicateDetection: props.requiresDuplicateDetection ?? true,
      deadLetteringOnMessageExpiration: props.deadLetteringOnMessageExpiration ?? true,
      defaultMessageTtl: props.defaultMessageTtl ?? 'P2D',
    })

    createAzureTfOutput(`${id}-servicebusQueueName`, scope, servicebusQueue.name)
    createAzureTfOutput(`${id}-servicebusQueueFriendlyUniqueId`, scope, servicebusQueue.friendlyUniqueId)
    createAzureTfOutput(`${id}-servicebusQueueId`, scope, servicebusQueue.id)

    return servicebusQueue
  }

  /**
   * @summary Method to create a new servicebus subscription
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props servicebus subscription properties
   * @see [CDKTF Servicebus Subscription Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/servicebusSubscription.typescript.md}
   */
  public createServicebusSubscription(id: string, scope: CommonAzureConstruct, props: ServicebusSubscriptionProps) {
    if (!props) throw `Props undefined for ${id}`

    const servicebusSubscription = new ServicebusSubscription(scope, `${id}-ss`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.serviceBusSubscription),
      maxDeliveryCount: props.maxDeliveryCount ?? 1,
    })

    createAzureTfOutput(`${id}-servicebusSubscriptionName`, scope, servicebusSubscription.name)
    createAzureTfOutput(`${id}-servicebusSubscriptionFriendlyUniqueId`, scope, servicebusSubscription.friendlyUniqueId)
    createAzureTfOutput(`${id}-servicebusSubscriptionId`, scope, servicebusSubscription.id)

    return servicebusSubscription
  }

  /**
   * @summary Method to resolve a new servicebus queue
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props servicebus queue properties
   * @see [CDKTF Servicebus Queue Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/servicebusQueue.typescript.md}
   */
  public resolveServicebusQueue(id: string, scope: CommonAzureConstruct, props: DataAzurermServicebusQueueProps) {
    if (!props) throw `Props undefined for ${id}`

    const servicebusQueue = new DataAzurermServicebusQueue(scope, `${id}-sq`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.serviceBusQueue),
      namespaceId: props.namespaceId,
    })

    createAzureTfOutput(`${id}-servicebusQueueName`, scope, servicebusQueue.name)
    createAzureTfOutput(`${id}-servicebusQueueFriendlyUniqueId`, scope, servicebusQueue.friendlyUniqueId)
    createAzureTfOutput(`${id}-servicebusQueueId`, scope, servicebusQueue.id)

    return servicebusQueue
  }
}
