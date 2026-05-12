import { DatabaseArgs, RedisEnterpriseArgs } from '@pulumi/azure-native/redisenterprise/index.js'

/**
 * Properties for creating an Azure Managed Redis (Enterprise) cluster
 * @see [Pulumi Azure Native Redis Enterprise]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/redisenterprise/redisenterprise/}
 * @category Interface
 */
export interface RedisEnterpriseClusterProps extends RedisEnterpriseArgs {}

/**
 * Properties for creating a Redis Enterprise database
 * @see [Pulumi Azure Native Redis Enterprise Database]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/redisenterprise/database/}
 * @category Interface
 */
export interface RedisDatabaseProps extends DatabaseArgs {}

/**
 * Result object containing the provisioned Redis Enterprise cluster and database
 * @category Interface
 */
export interface ManagedRedisResult {
  /** The provisioned Redis Enterprise cluster */
  cluster: import('@pulumi/azure-native/redisenterprise/index.js').RedisEnterprise
  /** The provisioned Redis Enterprise database */
  database: import('@pulumi/azure-native/redisenterprise/index.js').Database
}
