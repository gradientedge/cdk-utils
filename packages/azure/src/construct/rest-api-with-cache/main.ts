import { listDatabaseKeysOutput } from '@pulumi/azure-native/redisenterprise/index.js'
import * as pulumi from '@pulumi/pulumi'

import { AzureRestApi } from '../rest-api/main.js'

import { AzureApiWithCache, AzureRestApiWithCacheProps } from './types.js'

/**
 * Provides a construct to create and deploy an Azure API Management service with Azure Managed Redis (Enterprise) cache integration
 * @example
 * import { AzureRestApiWithCache, AzureRestApiWithCacheProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends AzureRestApiWithCache {
 *   constructor(id: string, props: AzureRestApiWithCacheProps) {
 *     super(id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class AzureRestApiWithCache extends AzureRestApi {
  props: AzureRestApiWithCacheProps
  declare api: AzureApiWithCache

  constructor(id: string, props: AzureRestApiWithCacheProps) {
    super(id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    super.initResources()
    this.createRedisCache()
    this.createRedisCacheSecret()
    this.createRedisCacheNamespace()
    this.createRedisCacheApiManagement()
  }

  /**
   * @summary Method to create the Azure Managed Redis (Enterprise) cluster and database
   */
  protected createRedisCache() {
    const result = this.redisManager.createManagedRedis(
      this.id,
      this,
      {
        ...this.props.apiManagementManagedRedis,
        clusterName: this.id,
        location: this.resourceGroup.location,
        resourceGroupName: this.resourceGroup.name,
      },
      this.props.apiManagementManagedRedisDatabase,
      { ignoreChanges: ['location'] }
    )
    this.api.redisCluster = result.cluster
    this.api.redisDatabase = result.database
  }

  /**
   * @summary Method to create the Redis cache connection string secret in Key Vault
   */
  protected createRedisCacheSecret() {
    const connectionString = pulumi
      .all([
        this.api.redisCluster.hostName,
        this.api.redisCluster.name,
        this.api.redisDatabase.name,
        this.resourceGroup.name,
      ])
      .apply(([hostName, clusterName, databaseName, resourceGroupName]) =>
        listDatabaseKeysOutput({
          clusterName,
          databaseName,
          resourceGroupName,
        }).apply(keys => `${hostName}:10000,password=${keys.primaryKey},ssl=True,abortConnect=False`)
      )

    this.api.redisNamedValueSecret = this.keyVaultManager.createKeyVaultSecret(
      `${this.id}-key-vault-redis-namespace-secret`,
      this,
      {
        vaultName: this.api.authKeyVault.name,
        secretName: `${this.api.redisCluster.name}key`,
        resourceGroupName: this.resourceGroup.name,
        properties: {
          value: connectionString,
        },
      },
      { dependsOn: [this.api.redisCluster, this.api.redisDatabase, this.api.namedValueRoleAssignment] }
    )
  }

  /**
   * @summary Method to create the API Management named value for the Redis cache secret
   */
  protected createRedisCacheNamespace() {
    this.api.redisNamedValue = this.apiManagementManager.createNamedValue(`${this.id}-redis-nv`, this, {
      displayName: `${this.api.redisCluster.name}key`,
      resourceGroupName: this.resourceGroup.name,
      serviceName: this.api.apim.name,
      namedValueId: `${this.api.redisCluster.name}key`,
      secret: true,
      keyVault: {
        secretIdentifier: this.api.redisNamedValueSecret.id,
      },
    })
  }

  /**
   * @summary Method to register the Redis cache with API Management
   */
  protected createRedisCacheApiManagement() {
    this.apiManagementManager.createCache(`${this.id}-am-redis-cache`, this, {
      serviceName: this.api.apim.name,
      connectionString: `{{${this.api.redisNamedValue.name}}}`,
      cacheId: this.api.redisCluster.id,
      resourceGroupName: this.resourceGroup.name,
      useFromLocation: this.api.redisCluster.location,
      description: `Redis cache for ${this.api.apim.name}`,
    })
  }
}
