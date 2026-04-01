import { getResourceGroupOutput, ResourceGroup } from '@pulumi/azure-native/resources/index.js'
import { ResourceOptions } from '@pulumi/pulumi'
import { CommonAzureConstruct } from '../../common/index.js'
import { ResourceGroupProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Resource Group using Pulumi
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
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Resource Group]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/resources/resourcegroup/}
   */
  public createResourceGroup(
    id: string,
    scope: CommonAzureConstruct,
    props: ResourceGroupProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new ResourceGroup(
      `${id}-rg`,
      {
        ...props,
        resourceGroupName: scope.resourceNameFormatter.format(
          props.resourceGroupName?.toString(),
          scope.props.resourceNameOptions?.resourceGroup
        ),
        location: props.location,
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to resolve an existing resource group
   * @param scope scope in which this resource is defined
   * @param resourceGroupName the resource group name
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public resolveResourceGroup(
    scope: CommonAzureConstruct,
    resourceGroupName: string,
    resourceOptions?: ResourceOptions
  ) {
    if (!resourceGroupName) throw `Resource Group Name undefined`

    return getResourceGroupOutput(
      {
        resourceGroupName: scope.resourceNameFormatter.format(
          resourceGroupName?.toString(),
          scope.props.resourceNameOptions?.resourceGroup
        ),
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
