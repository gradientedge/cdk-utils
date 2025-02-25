import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import {
  DataAzurermEventgridTopic,
  DataAzurermEventgridTopicConfig,
} from '@cdktf/provider-azurerm/lib/data-azurerm-eventgrid-topic'
import { EventgridTopic } from '@cdktf/provider-azurerm/lib/eventgrid-topic'
import { EventgridEventSubscription } from '@cdktf/provider-azurerm/lib/eventgrid-event-subscription'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { EventgridTopicProps, EventgridEventSubscriptionProps } from './types'

/**
 * @classdesc Provides operations on Azure Event Grid
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
 *     this.EventGridManager.createEventGrid('MyEventGrid', this, props)
 *   }
 * }
 * ```
 */
export class AzureEventgridManager {
  /**
   * @summary Method to create a new eventgrid topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid topic properties
   * @see [CDKTF Eventgrid Topic Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/eventgridTopic.typescript.md}
   */
  public createEventgridTopic(id: string, scope: CommonAzureConstruct, props: EventgridTopicProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-et-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const eventgridTopic = new EventgridTopic(scope, `${id}-et`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      location: resourceGroup.location,
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-eventgridTopicName`, scope, eventgridTopic.name)
    createAzureTfOutput(`${id}-eventgridTopicFriendlyUniqueId`, scope, eventgridTopic.friendlyUniqueId)
    createAzureTfOutput(`${id}-eventgridTopicId`, scope, eventgridTopic.id)
    createAzureTfOutput(`${id}-eventgridTopicEndpoint`, scope, eventgridTopic.endpoint)

    return eventgridTopic
  }

  /**
   * @summary Method to resolve an existing eventgrid topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid topic properties
   * @see [CDKTF Eventgrid Topic Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/eventgridTopic.typescript.md}
   */
  public resolveEventgridTopic(id: string, scope: CommonAzureConstruct, props: DataAzurermEventgridTopicConfig) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-et-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const eventgridTopic = new DataAzurermEventgridTopic(scope, `${id}-et`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      resourceGroupName: resourceGroup.name,
    })

    createAzureTfOutput(`${id}-eventgridTopicName`, scope, eventgridTopic.name)
    createAzureTfOutput(`${id}-eventgridTopicFriendlyUniqueId`, scope, eventgridTopic.friendlyUniqueId)
    createAzureTfOutput(`${id}-eventgridTopicId`, scope, eventgridTopic.id)
    createAzureTfOutput(`${id}-eventgridTopicEndpoint`, scope, eventgridTopic.endpoint)

    return eventgridTopic
  }

  /**
   * @summary Method to create a new eventgrid subscription
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid subsription properties
   * @see [CDKTF Eventgrid Subscription Container Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/eventgridEventSubscription.typescript.md}
   */
  public createEventgridSubscription(id: string, scope: CommonAzureConstruct, props: EventgridEventSubscriptionProps) {
    if (!props) throw `Props undefined for ${id}`

    const eventgridSubscription = new EventgridEventSubscription(scope, `${id}-es`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      eventDeliverySchema: props.eventDeliverySchema || 'CloudEventSchemaV1_0',
      advancedFilteringOnArraysEnabled: props.advancedFilteringOnArraysEnabled || true,
    })

    createAzureTfOutput(`${id}-eventgridSubscriptiontName`, scope, eventgridSubscription.name)
    createAzureTfOutput(`${id}-eventgridSubscriptionFriendlyUniqueId`, scope, eventgridSubscription.friendlyUniqueId)
    createAzureTfOutput(`${id}-eventgridSubscriptionId`, scope, eventgridSubscription.id)

    return eventgridSubscription
  }
}
