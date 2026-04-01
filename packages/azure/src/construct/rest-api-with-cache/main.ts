import { AzureRestApi } from '../rest-api/main.js'
import { AzureApiWithCache, AzureRestApiWithCacheProps } from './types.js'

/**
 * @classdesc Provides a construct to create and deploy an Azure API Management service with Redis cache integration
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
   * @summary Method to create the managed Redis cache instance
   */
  protected createRedisCache() {
    this.api.redis = this.redisManager.createManagedRedis(
      this.id,
      this,
      {
        ...this.props.apiManagementManagedRedis,
        name: this.props.stackName,
        location: this.resourceGroup.location,
        resourceGroupName: this.resourceGroup.name,
      },
      { ignoreChanges: ['location'] }
    )
  }

  /**
   * @summary Method to create the Redis cache connection string secret in Key Vault
   */
  protected createRedisCacheSecret() {
    this.api.redisNamedValueSecret = this.keyVaultManager.createKeyVaultSecret(
      `${this.id}-key-vault-redis-namespace-secret`,
      this,
      {
        vaultName: this.api.authKeyVault.name,
        secretName: `${this.api.redis.name}key`,
        resourceGroupName: this.resourceGroup.name,
        properties: {
          value: `${this.api.redis.name}:10000,password=${this.api.redis.accessKeys.primaryKey},ssl=True,abortConnect=False`,
        },
      },
      { dependsOn: [this.api.redis, this.api.namedValueRoleAssignment] }
    )
  }

  /**
   * @summary Method to create the API Management named value for the Redis cache secret
   */
  protected createRedisCacheNamespace() {
    this.api.redisNamedValue = this.apiManagementManager.createNamedValue(`${this.id}-redis-nv`, this, {
      displayName: `${this.api.redis.name}key`,
      resourceGroupName: this.resourceGroup.name,
      serviceName: this.api.apim.name,
      namedValueId: `${this.api.redis.name}key`,
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
      cacheId: this.api.redis.id,
      resourceGroupName: this.resourceGroup.name,
      useFromLocation: this.api.redis.location,
      description: `Redis cache for ${this.api.apim.name}`,
    })
  }
}
