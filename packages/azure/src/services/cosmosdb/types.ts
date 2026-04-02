import {
  DatabaseAccountArgs,
  SqlResourceSqlContainerArgs,
  SqlResourceSqlDatabaseArgs,
  SqlResourceSqlRoleAssignmentArgs,
} from '@pulumi/azure-native/cosmosdb/index.js'

/** @category Interface */
export interface CosmosdbAccountProps extends DatabaseAccountArgs {}

/** @category Interface */
export interface CosmosdbSqlDatabaseProps extends SqlResourceSqlDatabaseArgs {}

/** @category Interface */
export interface CosmosdbSqlContainerProps extends SqlResourceSqlContainerArgs {}

/** @category Interface */
export interface SqlResourceSqlRoleAssignmentProps extends SqlResourceSqlRoleAssignmentArgs {}
