import { ConfigurationStore, IdentityType } from '@pulumi/azure-native/appconfiguration/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { AppConfigurationProps } from './types.js'

/**
 * @classdesc Provides operations on Azure App Configuration using Pulumi
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
 *     this.appConfigurationManager.createAppConfiguration('MyAppConfiguration', this, props)
 *   }
 * }
 * ```
 */
export class AzureAppConfigurationManager {
  /**
   * @summary Method to create a new app configuration
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props app configuration properties
   * @see [Pulumi Azure Native App Configuration]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/appconfiguration/configurationstore/}
   */
  public createConfigurationStore(id: string, scope: CommonAzureConstruct, props: AppConfigurationProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new ConfigurationStore(
      `${id}-ac`,
      {
        ...props,
        configStoreName: scope.resourceNameFormatter.format(
          props.configStoreName?.toString(),
          scope.props.resourceNameOptions?.appConfiguration
        ),
        resourceGroupName: resourceGroupName,
        location: props.location ?? scope.props.location,
        identity: props.identity ?? {
          type: IdentityType.SystemAssigned,
        },
        sku: props.sku ?? {
          name: 'standard',
        },
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope }
    )
  }
}
