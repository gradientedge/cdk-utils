import { NamedValue } from '@pulumi/azure-native/apimanagement/index.js'
import { Secret } from '@pulumi/azure-native/keyvault/index.js'
import { Database, RedisEnterprise } from '@pulumi/azure-native/redisenterprise/index.js'

import { RedisDatabaseProps, RedisEnterpriseClusterProps } from '../../index.js'
import { AzureApi, AzureRestApiProps } from '../index.js'

/**
 * Properties for the {@link AzureRestApiWithCache} construct
 * @category Interface
 */
export interface AzureRestApiWithCacheProps extends AzureRestApiProps {
  /** Azure Managed Redis (Enterprise) cluster properties for API caching */
  apiManagementManagedRedis: RedisEnterpriseClusterProps
  /** Optional Redis database properties; defaults are applied if omitted */
  apiManagementManagedRedisDatabase?: Partial<RedisDatabaseProps>
}

/**
 * Provisioned API Management resources with Redis cache integration
 * @category Interface
 */
export interface AzureApiWithCache extends AzureApi {
  /** The provisioned Azure Managed Redis (Enterprise) cluster */
  redisCluster: RedisEnterprise
  /** The provisioned Redis database */
  redisDatabase: Database
  /** The Key Vault secret containing the Redis connection string */
  redisNamedValueSecret: Secret
  /** The API Management named value referencing the Redis connection secret */
  redisNamedValue: NamedValue
}
