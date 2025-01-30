import { ResourceGroup } from '@cdktf/provider-azurerm/lib/resource-group'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { ResourceGroupProps } from './types'

/**
 * @classdesc Provides operations on Azure Resource Group
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
 *     this.resourceGroupManager.createResourceGroup('MyResourceGroup', this, props)
 *   }
 * }
 * ```
 */
export class AzureResourceGroupManager {
  /**
   * @summary Method to create a new resource group
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props resource group properties
   * @see [CDKTF Resource Group Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/resourceGroup.typescript.md}
   */
  public createResourceGroup(id: string, scope: CommonAzureConstruct, props: ResourceGroupProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new ResourceGroup(scope, `${id}-rg`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-resourceGroupName`, scope, resourceGroup.name)
    createAzureTfOutput(`${id}-resourceGroupFriendlyUniqueId`, scope, resourceGroup.friendlyUniqueId)
    createAzureTfOutput(`${id}-resourceGroupId`, scope, resourceGroup.id)
  }
}
