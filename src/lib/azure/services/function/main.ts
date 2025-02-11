import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { LinuxFunctionApp } from '@cdktf/provider-azurerm/lib/linux-function-app'
import { FunctionAppFunction } from '@cdktf/provider-azurerm/lib/function-app-function'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { FunctionAppProps, FunctionProps } from './types'

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
 *     this.props = props
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
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const functionApp = new LinuxFunctionApp(scope, `${id}-fa`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
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
      name: `${props.name}-${scope.props.stage}`,
      configJson: JSON.stringify(props.configJson || {}),
    })

    createAzureTfOutput(`${id}-functionName`, scope, functionAppFunction.name)
    createAzureTfOutput(`${id}-functionFriendlyUniqueId`, scope, functionAppFunction.friendlyUniqueId)
    createAzureTfOutput(`${id}-functionId`, scope, functionAppFunction.id)

    return functionAppFunction
  }
}
