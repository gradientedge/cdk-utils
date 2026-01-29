import {
  DatabaseAccountArgs,
  SqlResourceSqlContainerArgs,
  SqlResourceSqlDatabaseArgs,
} from '@pulumi/azure-native/cosmosdb/index.js'

export interface CosmosdbAccountProps extends DatabaseAccountArgs {}

export interface CosmosdbSqlDatabaseProps extends SqlResourceSqlDatabaseArgs {}

export interface CosmosdbSqlContainerProps extends SqlResourceSqlContainerArgs {}
