import { ArgoSmartRouting } from '@cdktf/provider-cloudflare/lib/argo-smart-routing/index.js'
import { ArgoTieredCaching } from '@cdktf/provider-cloudflare/lib/argo-tiered-caching/index.js'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { createCloudflareTfOutput } from '../../utils/index.js'
import { ArgoSmartRoutingProps, ArgoTieredCachingProps } from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Argo
 * - A new instance of this class is injected into {@link CommonCloudflareConstruct} constructor.
 * - If a custom construct extends {@link CommonCloudflareConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct, CommonCloudflareConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(parent: Construct, id: string, props: CommonCloudflareStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.argoManager.createArgo('MyArgo', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareArgoManager {
  /**
   * @summary Method to create a new Cloudflare Argo
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props argo properties
   * @see [CDKTF Argo Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/argoSmartRouting.typescript.md}
   */
  public createArgoSmartRouting(id: string, scope: CommonCloudflareConstruct, props: ArgoSmartRoutingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const argoSmartRouting = new ArgoSmartRouting(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-argoSmartRoutingFriendlyUniqueId`, scope, argoSmartRouting.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-argoSmartRoutingId`, scope, argoSmartRouting.id)

    return argoSmartRouting
  }

  /**
   * @summary Method to create a new Cloudflare Argo
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props argo properties
   * @see [CDKTF Argo Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/argoTieredCaching.typescript.md}
   */
  public createArgoTieredCaching(id: string, scope: CommonCloudflareConstruct, props: ArgoTieredCachingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const argoTieredCaching = new ArgoTieredCaching(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-argoTieredCachingFriendlyUniqueId`, scope, argoTieredCaching.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-argoTieredCachingId`, scope, argoTieredCaching.id)

    return argoTieredCaching
  }
}
