import { ConfigurationStore, IdentityType } from '@pulumi/azure-native/appconfiguration/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { AppConfigurationProps } from './types.js'

/**
 * Provides operations on Azure App Configuration using Pulumi
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
 * @category Service
 */
export class AzureAppConfigurationManager {
  /**
   * @summary Method to create a new app configuration
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props app configuration properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native App Configuration]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/appconfiguration/configurationstore/}
   */
  public createConfigurationStore(
    id: string,
    scope: CommonAzureConstruct,
    props: AppConfigurationProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new ConfigurationStore(
      `${id}-ac`,
      {
        ...props,
        configStoreName: scope.resourceNameFormatter.format(
          props.configStoreName?.toString(),
          scope.props.resourceNameOptions?.appConfiguration
        ),
        resourceGroupName,
        location: props.location ?? scope.props.location,
        identity: props.identity ?? {
          type: IdentityType.SystemAssigned,
        },
        sku: props.sku ?? {
          name: 'standard',
        },
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Determine if the config object has cosmosdb dependencies
   * @param obj the config object value
   */
  static hasCosmosDependencies = (obj: any): boolean => {
    if (!obj || typeof obj !== 'object') return false
    if ('databaseName' in obj || 'tableName' in obj) return true
    return Object.values(obj).some(v => this.hasCosmosDependencies(v))
  }

  /**
   * @summary Determine if the config object has eventgrid target dependencies
   * @param obj the config object value
   */
  static hasEventGridTargets(obj: any): boolean {
    return (
      obj &&
      typeof obj === 'object' &&
      ('eventGridTargets' in obj || Object.values(obj).some(v => this.hasEventGridTargets(v)))
    )
  }
}
