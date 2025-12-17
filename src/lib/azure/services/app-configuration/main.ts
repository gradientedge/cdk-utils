import { AppConfiguration } from '@cdktf/provider-azurerm/lib/app-configuration/index.js'
import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { createAzureTfOutput } from '../../utils/index.js'
import { AppConfigurationProps } from './types.js'

/**
 * @classdesc Provides operations on Azure App Configuration
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
   * @see [CDKTF App Configuration plan Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/appConfiguration.typescript.md}
   */
  public createAppConfiguration(id: string, scope: CommonAzureConstruct, props: AppConfigurationProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-ac-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const appConfiguration = new AppConfiguration(scope, `${id}-ac`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.appConfiguration),
      resourceGroupName: resourceGroup.name,
      identity: {
        type: 'SystemAssigned',
      },
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-appConfigurationName`, scope, appConfiguration.name)
    createAzureTfOutput(`${id}-appConfigurationFriendlyUniqueId`, scope, appConfiguration.friendlyUniqueId)
    createAzureTfOutput(`${id}-appConfigurationId`, scope, appConfiguration.id)

    return appConfiguration
  }
}
