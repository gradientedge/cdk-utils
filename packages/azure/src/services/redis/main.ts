import {
  AccessKeysAuthentication,
  ClusteringPolicy,
  Database,
  DeferUpgradeSetting,
  EvictionPolicy,
  Protocol,
  RedisEnterprise,
  SkuName,
} from '@pulumi/azure-native/redisenterprise/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { ManagedRedisResult, RedisDatabaseProps, RedisEnterpriseClusterProps } from './types.js'

/**
 * Provides operations on Azure Managed Redis (Enterprise) using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.redisManager.createManagedRedis('MyManagedRedis', this, { cluster: clusterProps, database: databaseProps })
 *   }
 * }
 * ```
 * @category Service
 */
export class AzureRedisManager {
  /**
   * @summary Method to create a new Azure Managed Redis (Enterprise) cluster with a database
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param clusterProps redis enterprise cluster properties
   * @param databaseProps optional redis database properties (created with defaults if omitted)
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Redis Enterprise]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/redisenterprise/redisenterprise/}
   */
  public createManagedRedis(
    id: string,
    scope: CommonAzureConstruct,
    clusterProps: RedisEnterpriseClusterProps,
    databaseProps?: Partial<RedisDatabaseProps>,
    resourceOptions?: ResourceOptions
  ): ManagedRedisResult {
    if (!clusterProps) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      clusterProps.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    const cluster = new RedisEnterprise(
      `${id}-rc`,
      {
        ...clusterProps,
        clusterName: scope.resourceNameFormatter.format(
          clusterProps.clusterName?.toString(),
          scope.props.resourceNameOptions?.managedRedis
        ),
        location: clusterProps.location ?? scope.props.location,
        resourceGroupName,
        sku: clusterProps.sku ?? {
          name: SkuName.Balanced_B0,
        },
        tags: clusterProps.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )

    const database = new Database(
      `${id}-db`,
      {
        ...databaseProps,
        clusterName: cluster.name,
        resourceGroupName,
        databaseName: databaseProps?.databaseName ?? 'default',
        accessKeysAuthentication: databaseProps?.accessKeysAuthentication ?? AccessKeysAuthentication.Enabled,
        clientProtocol: databaseProps?.clientProtocol ?? Protocol.Encrypted,
        clusteringPolicy: databaseProps?.clusteringPolicy ?? ClusteringPolicy.OSSCluster,
        evictionPolicy: databaseProps?.evictionPolicy ?? EvictionPolicy.VolatileLRU,
        port: databaseProps?.port ?? 10000,
        persistence: databaseProps?.persistence ?? { aofEnabled: false, rdbEnabled: false },
        deferUpgrade: databaseProps?.deferUpgrade ?? DeferUpgradeSetting.NotDeferred,
      },
      { parent: scope, dependsOn: [cluster], ...resourceOptions }
    )

    return { cluster, database }
  }
}
