import {
  DatabaseAccount,
  getDatabaseAccountOutput,
  getSqlResourceSqlRoleDefinitionOutput,
  ResourceIdentityType,
  SqlResourceSqlContainer,
  SqlResourceSqlDatabase,
  SqlResourceSqlRoleAssignment,
} from '@pulumi/azure-native/cosmosdb/index.js'
import { Input, ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { CosmosRoleDefinition, CosmosRoleDefinitionId } from './constants.js'
import {
  CosmosdbAccountProps,
  CosmosdbSqlContainerProps,
  CosmosdbSqlDatabaseProps,
  SqlResourceSqlRoleAssignmentProps,
} from './types.js'

/**
 * Provides operations on Azure CosmosDB using Pulumi
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
 * @category Service
 */
export class AzureCosmosDbManager {
  /**
   * @summary Method to create a new cosmosdb account
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb account properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native CosmosDB Database Account]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/databaseaccount/}
   */
  public createCosmosDbAccount(
    id: string,
    scope: CommonAzureConstruct,
    props: CosmosdbAccountProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new cosmosdb database
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb database properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native CosmosDB SQL Database]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqldatabase/}
   */
  public createCosmosDbDatabase(
    id: string,
    scope: CommonAzureConstruct,
    props: CosmosdbSqlDatabaseProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new cosmosdb container
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props cosmosdb container properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native CosmosDB SQL Container]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqlcontainer/}
   */
  public createCosmosDbContainer(
    id: string,
    scope: CommonAzureConstruct,
    props: CosmosdbSqlContainerProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? `${scope.props.resourceGroupName}-${scope.props.stage}`
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a sql role assignment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props sql role assignment properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native CosmosDB SQL Role Assignment]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqlroleassignment/}
   */
  public createSqlResourceSqlRoleAssignment(
    id: string,
    scope: CommonAzureConstruct,
    props: SqlResourceSqlRoleAssignmentProps,
    resourceOptions?: ResourceOptions
  ) {
    return new SqlResourceSqlRoleAssignment(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to resolve an existing cosmosdb account
   * @param scope scope in which this resource is defined
   * @param accountName the account name
   * @param resourceGroupName the resource group name
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public resolveCosmosDbAccount(
    scope: CommonAzureConstruct,
    accountName: string,
    resourceGroupName: string,
    resourceOptions?: ResourceOptions
  ) {
    return getDatabaseAccountOutput({ accountName, resourceGroupName }, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to resolve an existing sql role definition
   * @param scope scope in which this resource is defined
   * @param accountName the account name
   * @param resourceGroupName the resource group name
   * @param roleDefinitionId the role definition id
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public resolveSqlRoleDefinition(
    scope: CommonAzureConstruct,
    accountName: Input<string>,
    resourceGroupName: string,
    roleDefinitionId: string,
    resourceOptions?: ResourceOptions
  ) {
    return getSqlResourceSqlRoleDefinitionOutput(
      { accountName, resourceGroupName, roleDefinitionId },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to assign a sql role assignment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param accountName the account name
   * @param resourceGroupName the resource group name
   * @param principalId the principal id to which the role is assigned to
   * @param roleDefinitions list of role definitions to
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public grantSqlRoleDefinitionToAccount(
    id: string,
    scope: CommonAzureConstruct,
    accountName: string,
    resourceGroupName: string,
    principalId: Input<string>,
    roleDefinitions: CosmosRoleDefinition[],
    resourceOptions?: ResourceOptions
  ) {
    const cosmosDbAccount = this.resolveCosmosDbAccount(scope, accountName, resourceGroupName, resourceOptions)

    if (roleDefinitions.includes(CosmosRoleDefinition.CONTRIBUTOR)) {
      const cosmosdbSqlRoleDefinitionContributor = this.resolveSqlRoleDefinition(
        scope,
        cosmosDbAccount.name,
        resourceGroupName,
        CosmosRoleDefinitionId.CONTRIBUTOR,
        resourceOptions
      )

      this.createSqlResourceSqlRoleAssignment(
        `${id}-cdb-ra-contributor`,
        scope,
        {
          accountName: cosmosDbAccount.name,
          resourceGroupName: resourceGroupName,
          roleDefinitionId: cosmosdbSqlRoleDefinitionContributor.id,
          principalId,
          scope: cosmosDbAccount.id,
        },
        resourceOptions
      )
    }

    if (roleDefinitions.includes(CosmosRoleDefinition.READER)) {
      const cosmosdbSqlRoleDefinitionReader = this.resolveSqlRoleDefinition(
        scope,
        cosmosDbAccount.name,
        resourceGroupName,
        CosmosRoleDefinitionId.READER,
        resourceOptions
      )

      this.createSqlResourceSqlRoleAssignment(
        `${id}-cdb-ra-reader`,
        scope,
        {
          accountName: cosmosDbAccount.name,
          resourceGroupName: resourceGroupName,
          roleDefinitionId: cosmosdbSqlRoleDefinitionReader.id,
          principalId,
          scope: cosmosDbAccount.id,
        },
        resourceOptions
      )
    }
  }
}
