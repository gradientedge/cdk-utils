import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { LogAnalyticsWorkspace } from '@cdktf/provider-azurerm/lib/log-analytics-workspace'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { LogAnalyticsWorkspaceProps } from './types'

/**
 * @classdesc Provides operations on Azure Log Analytics Workspace
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
 *     this.LogAnalyticWorkspaceManager.createLogAnalyticsWorkspace('MyLogAnalyticsWorkspace', this, props)
 *   }
 * }
 * ```
 */
export class AzureLogAnalyticsWorkspaceManager {
  /**
   * @summary Method to create a new cosmosdb account
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb account properties
   * @see [CDKTF CosmosDb Account Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/logAnalyticsWorkspace.typescript.md}
   */
  public createLogAnalyticsWorkspace(id: string, scope: CommonAzureConstruct, props: LogAnalyticsWorkspaceProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-lw-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const logAnalyticsWorkspace = new LogAnalyticsWorkspace(scope, `${id}-lw`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.logAnalyticsWorkspace),
      location: resourceGroup.location,
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-logAnalyticsWorkspaceName`, scope, logAnalyticsWorkspace.name)
    createAzureTfOutput(`${id}-logAnalyticsWorkspaceFriendlyUniqueId`, scope, logAnalyticsWorkspace.friendlyUniqueId)
    createAzureTfOutput(`${id}-logAnalyticsWorkspaceId`, scope, logAnalyticsWorkspace.id)

    return logAnalyticsWorkspace
  }
}
