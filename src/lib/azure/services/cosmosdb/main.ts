import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { CosmosdbAccount } from '@cdktf/provider-azurerm/lib/cosmosdb-account'
import { CosmosdbSqlDatabase } from '@cdktf/provider-azurerm/lib/cosmosdb-sql-database'
import { CosmosdbSqlContainer } from '@cdktf/provider-azurerm/lib/cosmosdb-sql-container'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { CosmosdbAccountProps, CosmosdbSqlContainerProps, CosmosdbSqlDatabaseProps } from './types'

/**
 * @classdesc Provides operations on Azure CosmosDB
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
 *     this.CosmosDbManager.createCosmosAccount('MyCosmosDb', this, props)
 *   }
 * }
 * ```
 */
export class AzureCosmosDbManager {
  /**
   * @summary Method to create a new cosmosdb account
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb account properties
   * @see [CDKTF CosmosDb Account Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/cosmosdbAccount.typescript.md}
   */
  public createCosmosDbAccount(id: string, scope: CommonAzureConstruct, props: CosmosdbAccountProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-ca-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const cosmosdbAccount = new CosmosdbAccount(scope, `${id}-ca`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.cosmosDbAccount),
      location: resourceGroup.location,
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-cosmosdbAccountName`, scope, cosmosdbAccount.name)
    createAzureTfOutput(`${id}-cosmosdbAccountFriendlyUniqueId`, scope, cosmosdbAccount.friendlyUniqueId)
    createAzureTfOutput(`${id}-cosmosdbAccountId`, scope, cosmosdbAccount.id)

    return cosmosdbAccount
  }

  /**
   * @summary Method to create a new cosmosdb database
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb container properties
   * @see [CDKTF CosmosDb Container Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/cosmosdbSqlContainer.typescript.md}
   */
  public createCosmosDbDatabase(id: string, scope: CommonAzureConstruct, props: CosmosdbSqlDatabaseProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-cd-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const cosmosdbDatatbase = new CosmosdbSqlDatabase(scope, `${id}-cd`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.cosmosDbSqlDatabase),
      resourceGroupName: resourceGroup.name,
    })

    createAzureTfOutput(`${id}-cosmosdbDatatbasetName`, scope, cosmosdbDatatbase.name)
    createAzureTfOutput(`${id}-cosmosdbDatatbaseFriendlyUniqueId`, scope, cosmosdbDatatbase.friendlyUniqueId)
    createAzureTfOutput(`${id}-cosmosdbDatatbaseId`, scope, cosmosdbDatatbase.id)

    return cosmosdbDatatbase
  }

  /**
   * @summary Method to create a new cosmosdb container
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb container properties
   * @see [CDKTF CosmosDb Container Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/cosmosdbSqlContainer.typescript.md}
   */
  public createCosmosDbContainer(id: string, scope: CommonAzureConstruct, props: CosmosdbSqlContainerProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-cc-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const cosmosdbContainer = new CosmosdbSqlContainer(scope, `${id}-cc`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.cosmosDbSqlContainer),
      resourceGroupName: resourceGroup.name,
    })

    createAzureTfOutput(`${id}-cosmosdbContainertName`, scope, cosmosdbContainer.name)
    createAzureTfOutput(`${id}-cosmosdbContainerFriendlyUniqueId`, scope, cosmosdbContainer.friendlyUniqueId)
    createAzureTfOutput(`${id}-cosmosdbContainerId`, scope, cosmosdbContainer.id)

    return cosmosdbContainer
  }
}
