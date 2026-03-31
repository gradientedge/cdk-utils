import { AzureRestApi } from '../rest-api/main.js'
import { AzureApiWithCache, AzureRestApiWithCacheProps } from './types.js'

export class AzureRestApiWithCache extends AzureRestApi {
  props: AzureRestApiWithCacheProps
  declare api: AzureApiWithCache

  constructor(id: string, props: AzureRestApiWithCacheProps) {
    super(id, props)
    this.props = props
    this.id = id
  }

  public initResources() {
    super.initResources()
    this.createRedisCache()
    this.createRedisCacheSecret()
    this.createRedisCacheNamespace()
    this.createRedisCacheApiManagement()
  }

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
