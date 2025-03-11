import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { ServicePlan } from '@cdktf/provider-azurerm/lib/service-plan'
import { LinuxWebApp } from '@cdktf/provider-azurerm/lib/linux-web-app'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { ServicePlanProps, LinuxWebAppProps } from './types'

/**
 * @classdesc Provides operations on Azure App Service
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
 *     this.appServiceManager.createAppService('MyAppService', this, props)
 *   }
 * }
 * ```
 */
export class AzureAppServiceManager {
  /**
   * @summary Method to create a new app service plan
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props app service plan properties
   * @see [CDKTF App service plan Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/appServicePlan.typescript.md}
   */
  public createAppServicePlan(id: string, scope: CommonAzureConstruct, props: ServicePlanProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-as-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const appServicePlan = new ServicePlan(scope, `${id}-as`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.appServicePlan),
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-appServicePlanName`, scope, appServicePlan.name)
    createAzureTfOutput(`${id}-appServicePlanFriendlyUniqueId`, scope, appServicePlan.friendlyUniqueId)
    createAzureTfOutput(`${id}-appServicePlanId`, scope, appServicePlan.id)

    return appServicePlan
  }

  /**
   * @summary Method to create a new web app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props web app properties
   * @see [CDKTF Web App Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/linuxWebApp.typescript.md}
   */
  public createLinuxWebApp(id: string, scope: CommonAzureConstruct, props: LinuxWebAppProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-as-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const linuxWebApp = new LinuxWebApp(scope, `${id}-lwa`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.linuxWebApp),
      resourceGroupName: resourceGroup.name,
      httpsOnly: props.httpsOnly || true,

      identity: props.identity || {
        type: 'SystemAssigned',
      },
      siteConfig: {
        ...props.siteConfig,
        alwaysOn: props.siteConfig.alwaysOn || true,
        applicationStack: props.siteConfig.applicationStack || { nodeVersion: '22-lts' },
      },
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-linuxWebAppName`, scope, linuxWebApp.name)
    createAzureTfOutput(`${id}-linuxWebAppFriendlyUniqueId`, scope, linuxWebApp.friendlyUniqueId)
    createAzureTfOutput(`${id}-linuxWebAppId`, scope, linuxWebApp.id)

    return linuxWebApp
  }
}
