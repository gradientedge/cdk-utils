import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { ApiManagement } from '@cdktf/provider-azurerm/lib/api-management'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { ApiManagementProps } from './types'

/**
 * @classdesc Provides operations on Azure Api Management
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
 *     this.apiManagementManager.createApiManagement('MyApiManagement', this, props)
 *   }
 * }
 * ```
 */
export class AzureApiManagementManager {
  /**
   * @summary Method to create a new api management
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props api management properties
   * @see [CDKTF Api management Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/apiManagement.typescript.md}
   */
  public createApiManagement(id: string, scope: CommonAzureConstruct, props: ApiManagementProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-am-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}-${scope.props.stage}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const apiManagement = new ApiManagement(scope, `${id}-am`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-apiManagementName`, scope, apiManagement.name)
    createAzureTfOutput(`${id}-apiManagementFriendlyUniqueId`, scope, apiManagement.friendlyUniqueId)
    createAzureTfOutput(`${id}-apiManagementId`, scope, apiManagement.id)

    return apiManagement
  }
}
