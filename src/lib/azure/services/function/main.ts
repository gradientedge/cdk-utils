import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { LinuxFunctionApp } from '@cdktf/provider-azurerm/lib/linux-function-app'
import { FunctionAppFunction } from '@cdktf/provider-azurerm/lib/function-app-function'
import { FunctionAppFlexConsumption } from '@cdktf/provider-azurerm/lib/function-app-flex-consumption'
import { LocalExec, Provider } from 'cdktf-local-exec'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { FunctionAppProps, FunctionProps, FunctionAppFlexConsumptionProps } from './types'

/**
 * @classdesc Provides operations on Azure Functions
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
 *     this.props: props
 *     this.functionManager.createFunctionApp('MyFunctionApp', this, props)
 *   }
 * }
 * ```
 */
export class AzureFunctionManager {
  /**
   * @summary Method to create a new function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props function app properties
   * @see [CDKTF Function App Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/functionApp.typescript.md}
   */
  public createFunctionApp(id: string, scope: CommonAzureConstruct, props: FunctionAppProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-fa-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const functionApp = new LinuxFunctionApp(scope, `${id}-fa`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.linuxFunctionApp),
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-functionAppName`, scope, functionApp.name)
    createAzureTfOutput(`${id}-functionAppFriendlyUniqueId`, scope, functionApp.friendlyUniqueId)
    createAzureTfOutput(`${id}-functionAppId`, scope, functionApp.id)

    return functionApp
  }

  /**
   * @summary Method to create a new function
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props function properties
   * @see [CDKTF Function Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/functionAppFunction.typescript.md}
   */
  public createFunction(id: string, scope: CommonAzureConstruct, props: FunctionProps) {
    if (!props) throw `Props undefined for ${id}`

    const functionAppFunction = new FunctionAppFunction(scope, `${id}-fc`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.functionAppFunction),
      configJson: JSON.stringify(props.configJson ?? {}),
    })

    createAzureTfOutput(`${id}-functionName`, scope, functionAppFunction.name)
    createAzureTfOutput(`${id}-functionFriendlyUniqueId`, scope, functionAppFunction.friendlyUniqueId)
    createAzureTfOutput(`${id}-functionId`, scope, functionAppFunction.id)

    return functionAppFunction
  }

  /**
   * @summary Method to create a new flex consumption function app
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props flex consumption function app properties
   */
  public createFunctionAppFlexConsumption(
    id: string,
    scope: CommonAzureConstruct,
    props: FunctionAppFlexConsumptionProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-fa-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const functionApp = new FunctionAppFlexConsumption(scope, `${id}-fc`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.functionApp),
      location: resourceGroup.location,
      resourceGroupName: resourceGroup.name,
      runtimeName: props.runtimeName ?? 'node',
      runtimeVersion: props.runtimeVersion ?? '22',
      storageAuthenticationType: props.storageAuthenticationType ?? 'StorageAccountConnectionString',
      storageContainerType: props.storageContainerType ?? 'blobContainer',
      maximumInstanceCount: props.maximumInstanceCount ?? 40,
      instanceMemoryInMb: props.instanceMemoryInMb ?? 2048,
      siteConfig: {
        http2Enabled: props.siteConfig.http2Enabled ?? true,
        ...props.siteConfig,
      },
      identity: props.identity ?? {
        type: 'SystemAssigned',
      },
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    new Provider(scope, `${id}-local-exec-provider`)
    // Deploy function app zip package with up to 3 retry attempts.
    // This handles transient issues like HTTP 503s returned from the Azure Kudu deployment endpoint.
    new LocalExec(scope, `${id}-function-app-deploy`, {
      triggers: {
        hash: props.sourceCodeHash,
      },
      command: `
        set -e
        MAX_RETRIES=3
        RETRY_COUNT=0
        until az functionapp deployment source config-zip --resource-group "${resourceGroup.name}" --name "${functionApp.name}" --src "${props.deploySource}"; do
          RETRY_COUNT=$((RETRY_COUNT+1))
          echo "Deployment attempt $RETRY_COUNT failed. Retrying in 10 seconds..."
          if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
            echo "Deployment failed after $MAX_RETRIES attempts."
            exit 1
          fi
          sleep 10
        done
        echo "Deployment succeeded."
      `,
    })

    return functionApp
  }
}
