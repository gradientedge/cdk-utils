import {
  DatabaseAccountArgs,
  SqlResourceSqlContainerArgs,
  SqlResourceSqlDatabaseArgs,
  SqlResourceSqlRoleAssignmentArgs,
} from '@pulumi/azure-native/cosmosdb/index.js'

export interface CosmosdbAccountProps extends DatabaseAccountArgs {}

export interface CosmosdbSqlDatabaseProps extends SqlResourceSqlDatabaseArgs {}

export interface CosmosdbSqlContainerProps extends SqlResourceSqlContainerArgs {}

export interface SqlResourceSqlRoleAssignmentProps extends SqlResourceSqlRoleAssignmentArgs {}
