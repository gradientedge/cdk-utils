import {
  DatabaseAccount,
  ResourceIdentityType,
  SqlResourceSqlContainer,
  SqlResourceSqlDatabase,
} from '@pulumi/azure-native/cosmosdb/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { CosmosdbAccountProps, CosmosdbSqlContainerProps, CosmosdbSqlDatabaseProps } from './types.js'

/**
 * @classdesc Provides operations on Azure CosmosDB using Pulumi
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
 *     this.CosmosDbManager.createCosmosDbAccount('MyCosmosDb', this, props)
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
   * @see [Pulumi Azure Native CosmosDB Account]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/databaseaccount/}
   */
  public createCosmosDbAccount(id: string, scope: CommonAzureConstruct, props: CosmosdbAccountProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new DatabaseAccount(
      `${id}-ca`,
      {
        ...props,
        accountName: scope.resourceNameFormatter.format(
          props.accountName?.toString(),
          scope.props.resourceNameOptions?.cosmosDbAccount
        ),
        location: props.location ?? scope.props.location,
        resourceGroupName: resourceGroupName,
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
        identity: props.identity ?? {
          type: ResourceIdentityType.SystemAssigned,
        },
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new cosmosdb database
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb database properties
   * @see [Pulumi Azure Native CosmosDB SQL Database]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqldatabase/}
   */
  public createCosmosDbDatabase(id: string, scope: CommonAzureConstruct, props: CosmosdbSqlDatabaseProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new SqlResourceSqlDatabase(
      `${id}-cd`,
      {
        ...props,
        databaseName: scope.resourceNameFormatter.format(
          props.databaseName?.toString(),
          scope.props.resourceNameOptions?.cosmosDbSqlDatabase
        ),
        resourceGroupName: resourceGroupName,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new cosmosdb container
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb container properties
   * @see [Pulumi Azure Native CosmosDB SQL Container]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqlcontainer/}
   */
  public createCosmosDbContainer(id: string, scope: CommonAzureConstruct, props: CosmosdbSqlContainerProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? `${scope.props.resourceGroupName}-${scope.props.stage}`
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new SqlResourceSqlContainer(
      `${id}-cc`,
      {
        ...props,
        containerName: scope.resourceNameFormatter.format(
          props.containerName?.toString(),
          scope.props.resourceNameOptions?.cosmosDbSqlContainer
        ),
        resourceGroupName: resourceGroupName,
      },
      { parent: scope }
    )
  }
}
