import { CosmosdbAccountConfig } from '@cdktf/provider-azurerm/lib/cosmosdb-account/index.js'
import { CosmosdbSqlDatabaseConfig } from '@cdktf/provider-azurerm/lib/cosmosdb-sql-database/index.js'
import { CosmosdbSqlContainerConfig } from '@cdktf/provider-azurerm/lib/cosmosdb-sql-container/index.js'

export interface CosmosdbAccountProps extends CosmosdbAccountConfig {}
export interface CosmosdbSqlDatabaseProps extends CosmosdbSqlDatabaseConfig {}
export interface CosmosdbSqlContainerProps extends CosmosdbSqlContainerConfig {}
