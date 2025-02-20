import { ServicebusTopic } from '@cdktf/provider-azurerm/lib/servicebus-topic'
import { ServicebusSubscription } from '@cdktf/provider-azurerm/lib/servicebus-subscription'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { ServicebusTopicProps, ServicebusSubscriptionProps } from './types'

/**
 * @classdesc Provides operations on Azure CosmosDB
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
 *     this.CosmosDbManager.createCosmosAccount('MyCosmosDb', this, props)
 *   }
 * }
 * ```
 */
export class AzureServiceBusManager {
  /**
   * @summary Method to create a new servicebus topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props servicebus topic properties
   * @see [CDKTF Servicebus Topic Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/cosmosdbAccount.typescript.md}
   */
  public createServicebusTopic(id: string, scope: CommonAzureConstruct, props: ServicebusTopicProps) {
    if (!props) throw `Props undefined for ${id}`

    const servicebusTopic = new ServicebusTopic(scope, `${id}-st`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
    })

    createAzureTfOutput(`${id}-servicebusTopicName`, scope, servicebusTopic.name)
    createAzureTfOutput(`${id}-servicebusTopicFriendlyUniqueId`, scope, servicebusTopic.friendlyUniqueId)
    createAzureTfOutput(`${id}-servicebusTopicId`, scope, servicebusTopic.id)

    return servicebusTopic
  }

  /**
   * @summary Method to create a new servicebus subscription
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props servicebus subscription properties
   * @see [CDKTF Servicebus Subscription Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/cosmosdbAccount.typescript.md}
   */
  public createServicebusSubscription(id: string, scope: CommonAzureConstruct, props: ServicebusSubscriptionProps) {
    if (!props) throw `Props undefined for ${id}`

    const servicebusSubscription = new ServicebusSubscription(scope, `${id}-ss`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
    })

    createAzureTfOutput(`${id}-servicebusSubscriptionName`, scope, servicebusSubscription.name)
    createAzureTfOutput(`${id}-servicebusSubscriptionFriendlyUniqueId`, scope, servicebusSubscription.friendlyUniqueId)
    createAzureTfOutput(`${id}-servicebusSubscriptionId`, scope, servicebusSubscription.id)

    return servicebusSubscription
  }
}
