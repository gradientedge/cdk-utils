import { CosmosdbAccountConfig } from '@cdktf/provider-azurerm/lib/cosmosdb-account'
import { CosmosdbSqlDatabaseConfig } from '@cdktf/provider-azurerm/lib/cosmosdb-sql-database'
import { CosmosdbSqlContainerConfig } from '@cdktf/provider-azurerm/lib/cosmosdb-sql-container'
import { CosmosdbTableConfig } from '@cdktf/provider-azurerm/lib/cosmosdb-table'

export interface CosmosdbAccountProps extends CosmosdbAccountConfig {}
export interface CosmosdbSqlDatabaseProps extends CosmosdbSqlDatabaseConfig {}
export interface CosmosdbSqlContainerProps extends CosmosdbSqlContainerConfig {}
export interface CosmosdbTableProps extends CosmosdbTableConfig {}
