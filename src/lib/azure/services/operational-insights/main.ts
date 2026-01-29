import { Workspace, WorkspaceSkuNameEnum } from '@pulumi/azure-native/operationalinsights/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { WorkspaceProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Log Analytics Workspace using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.logAnalyticsWorkspaceManager.createLogAnalyticsWorkspace('MyLogAnalyticsWorkspace', this, props)
 *   }
 * }
 * ```
 */
export class AzureOperationalInsightsManager {
  /**
   * @summary Method to create a new log analytics workspace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props log analytics workspace properties
   * @see [Pulumi Azure Native Operational Insights Workspace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/operationalinsights/workspace/}
   */
  public createWorkspace(id: string, scope: CommonAzureConstruct, props: WorkspaceProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new Workspace(
      `${id}-lw`,
      {
        ...props,
        workspaceName: scope.resourceNameFormatter.format(
          props.workspaceName?.toString(),
          scope.props.resourceNameOptions?.logAnalyticsWorkspace
        ),
        location: props.location ?? scope.props.location,
        resourceGroupName: resourceGroupName,
        sku: props.sku ?? {
          name: WorkspaceSkuNameEnum.PerGB2018,
        },
        retentionInDays: props.retentionInDays ?? 30,
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope }
    )
  }
}
