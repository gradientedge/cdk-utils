import {
  AppServicePlan,
  ManagedServiceIdentityType,
  SupportedTlsVersions,
  WebApp,
} from '@pulumi/azure-native/web/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { LinuxWebAppProps, ServicePlanProps } from './types.js'

/**
 * Provides operations on Azure App Service using Pulumi
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
 *     this.appServiceManager.createAppServicePlan('MyAppService', this, props)
 *   }
 * }
 * ```
 * @category Service
 */
export class AzureAppServiceManager {
  /**
   * @summary Method to create a new app service plan
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props app service plan properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native App Service Plan]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/appserviceplan/}
   */
  public createAppServicePlan(
    id: string,
    scope: CommonAzureConstruct,
    props: ServicePlanProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

    return new AppServicePlan(
      `${id}-as`,
      {
        ...props,
        name: scope.resourceNameFormatter.format(
          props.name?.toString(),
          scope.props.resourceNameOptions?.appServicePlan
        ),
        resourceGroupName: resourceGroupName,
        location: props.location ?? scope.props.location,
        sku: props.sku ?? {
          name: 'FC1',
          tier: 'FlexConsumption',
        },
        reserved: props.reserved ?? true,
        zoneRedundant: props.zoneRedundant ?? true,
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new Linux web app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props web app properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Web App]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
   */
  public createLinuxWebApp(
    id: string,
    scope: CommonAzureConstruct,
    props: LinuxWebAppProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

    return new WebApp(
      `${id}-lwa`,
      {
        ...props,
        name: scope.resourceNameFormatter.format(props.name?.toString(), scope.props.resourceNameOptions?.linuxWebApp),
        resourceGroupName: resourceGroupName,
        location: props.location ?? scope.props.location,
        httpsOnly: props.httpsOnly ?? true,
        kind: props.kind ?? 'app,linux',
        identity: props.identity ?? {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        siteConfig: props.siteConfig ?? {
          alwaysOn: true,
          linuxFxVersion: 'NODE|22-lts',
          minTlsVersion: SupportedTlsVersions.SupportedTlsVersions_1_3,
        },
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
