import { ManagedServiceIdentityType, WebApp, WebAppFunction } from '@pulumi/azure-native/web/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { FunctionAppFlexConsumptionProps, FunctionAppProps, FunctionProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Functions using Pulumi
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
 *     this.functionManager.createFunctionApp('MyFunctionApp', this, props)
 *   }
 * }
 * ```
 */
export class AzureFunctionManager {
  /**
   * @summary Method to create a new Linux function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props function app properties
   * @see [Pulumi Azure Native Function App]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
   */
  public createFunctionApp(id: string, scope: CommonAzureConstruct, props: FunctionAppProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new WebApp(
      `${id}-fa`,
      {
        ...props,
        name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.linuxFunctionApp),
        resourceGroupName: resourceGroupName,
        location: props.location ?? scope.props.location,
        kind: props.kind ?? 'functionapp,linux',
        identity: props.identity ?? {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new function within a function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props function properties
   * @see [Pulumi Azure Native Function Envelope]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webappfunction/}
   * @note In Pulumi, individual functions are typically deployed via code deployment rather than as separate infrastructure resources.
   * This method is provided for API compatibility but may require additional setup.
   */
  public createFunction(id: string, scope: CommonAzureConstruct, props: FunctionProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : ''

    return new WebAppFunction(
      `${id}-fc`,
      {
        name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.functionAppFunction),
        resourceGroupName: resourceGroupName,
        functionAppId: props.functionAppId,
        config: props.configJson,
        isDisabled: props.enabled !== undefined ? !props.enabled : false,
        testData: props.testData,
      } as any,
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new flex consumption function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props flex consumption function app properties
   * @see [Pulumi Azure Native Function App (Flex Consumption)]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/web/webapp/}
   */
  public createFunctionAppFlexConsumption(
    id: string,
    scope: CommonAzureConstruct,
    props: FunctionAppFlexConsumptionProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new WebApp(
      `${id}-fc`,
      {
        ...props,
        name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.functionApp),
        location: props.location ?? scope.props.location,
        resourceGroupName: resourceGroupName,
        kind: props.kind ?? 'functionapp,linux',
        identity: props.identity ?? {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        siteConfig: props.siteConfig ?? {
          http20Enabled: true,
          linuxFxVersion: `${props.runtimeName ?? 'node'}|${props.runtimeVersion ?? '22'}`,
        },
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope }
    )
  }
}
