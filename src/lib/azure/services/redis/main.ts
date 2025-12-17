import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group/index.js'
import { RedisCache } from '@cdktf/provider-azurerm/lib/redis-cache/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { createAzureTfOutput } from '../../utils/index.js'
import { RedisCacheProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Redis
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.redisManager.createRedis('MyRedisCache', this, props)
 *   }
 * }
 * ```
 */
export class AzureRedisManager {
  /**
   * @summary Method to create a new redis cache
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props redis cache properties
   * @see [CDKTF Redis Cache Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/redisCache.typescript.md}
   */
  public createRedisCache(id: string, scope: CommonAzureConstruct, props: RedisCacheProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-rc-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const redisCache = new RedisCache(scope, `${id}-rc`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.redisCache),
      location: resourceGroup.location,
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-redisCacheName`, scope, redisCache.name)
    createAzureTfOutput(`${id}-redisCacheFriendlyUniqueId`, scope, redisCache.friendlyUniqueId)
    createAzureTfOutput(`${id}-redisCacheId`, scope, redisCache.id)

    return redisCache
  }
}
