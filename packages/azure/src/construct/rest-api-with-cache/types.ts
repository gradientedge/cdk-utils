import { NamedValue } from '@pulumi/azure-native/apimanagement/index.js'
import { Secret } from '@pulumi/azure-native/keyvault/index.js'
import { Database, RedisEnterprise } from '@pulumi/azure-native/redisenterprise/index.js'

import { RedisDatabaseProps, RedisEnterpriseClusterProps } from '../../index.js'
import { AzureApi, AzureRestApiProps } from '../index.js'

/** @category Interface */
export interface AzureRestApiWithCacheProps extends AzureRestApiProps {
  apiManagementManagedRedis: RedisEnterpriseClusterProps
  apiManagementManagedRedisDatabase?: Partial<RedisDatabaseProps>
}

/** @category Interface */
export interface AzureApiWithCache extends AzureApi {
  redisCluster: RedisEnterprise
  redisDatabase: Database
  redisNamedValueSecret: Secret
  redisNamedValue: NamedValue
}
