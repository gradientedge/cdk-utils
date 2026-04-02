import { Table, Workspace, WorkspaceSkuNameEnum } from '@pulumi/azure-native/operationalinsights/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { WorkspaceProps, WorkspaceTableProps } from './types.js'

/**
 * Provides operations on Azure Log Analytics Workspace using Pulumi
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
 * @category Service
 */
export class AzureOperationalInsightsManager {
  /**
   * @summary Method to create a new log analytics workspace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props log analytics workspace properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Operational Insights Workspace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/operationalinsights/workspace/}
   */
  public createWorkspace(
    id: string,
    scope: CommonAzureConstruct,
    props: WorkspaceProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new log analytics workspace table
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props log analytics workspace table properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Operational Insights Table]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/operationalinsights/table/}
   */
  public createTable(
    id: string,
    scope: CommonAzureConstruct,
    props: WorkspaceTableProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new Table(`${id}`, props, { parent: scope, ...resourceOptions })
  }
}
