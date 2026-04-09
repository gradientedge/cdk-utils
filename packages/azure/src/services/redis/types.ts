import { DatabaseArgs, RedisEnterpriseArgs } from '@pulumi/azure-native/redisenterprise/index.js'

/** @category Interface */
export interface RedisEnterpriseClusterProps extends RedisEnterpriseArgs {}

/** @category Interface */
export interface RedisDatabaseProps extends DatabaseArgs {}

/** @category Interface */
export interface ManagedRedisResult {
  cluster: import('@pulumi/azure-native/redisenterprise/index.js').RedisEnterprise
  database: import('@pulumi/azure-native/redisenterprise/index.js').Database
}
