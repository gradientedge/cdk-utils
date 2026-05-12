import {
  DatabaseAccountArgs,
  SqlResourceSqlContainerArgs,
  SqlResourceSqlDatabaseArgs,
  SqlResourceSqlRoleAssignmentArgs,
} from '@pulumi/azure-native/cosmosdb/index.js'

/**
 * Properties for creating a CosmosDB database account
 * @see [Pulumi Azure Native CosmosDB Database Account]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/databaseaccount/}
 * @category Interface
 */
export interface CosmosdbAccountProps extends DatabaseAccountArgs {}

/**
 * Properties for creating a CosmosDB SQL database
 * @see [Pulumi Azure Native CosmosDB SQL Database]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqldatabase/}
 * @category Interface
 */
export interface CosmosdbSqlDatabaseProps extends SqlResourceSqlDatabaseArgs {}

/**
 * Properties for creating a CosmosDB SQL container
 * @see [Pulumi Azure Native CosmosDB SQL Container]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqlcontainer/}
 * @category Interface
 */
export interface CosmosdbSqlContainerProps extends SqlResourceSqlContainerArgs {}

/**
 * Properties for creating a CosmosDB SQL role assignment
 * @see [Pulumi Azure Native CosmosDB SQL Role Assignment]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/documentdb/sqlresourcesqlroleassignment/}
 * @category Interface
 */
export interface SqlResourceSqlRoleAssignmentProps extends SqlResourceSqlRoleAssignmentArgs {}
