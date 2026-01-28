import * as cloudflare from '@pulumi/cloudflare'
import { CommonCloudflareConstruct } from '../../common/index.js'
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
   * @summary Method to create a new Cloudflare Argo Smart Routing
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props argo properties
   * @see [Pulumi Cloudflare ArgoSmartRouting]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/argosmartrouting/}
   */
  public createArgoSmartRouting(id: string, scope: CommonCloudflareConstruct, props: ArgoSmartRoutingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.ArgoSmartRouting(`${id}`, {
      ...props,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Argo Tiered Caching
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props argo properties
   * @see [Pulumi Cloudflare ArgoTieredCaching]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/argotieredcaching/}
   */
  public createArgoTieredCaching(id: string, scope: CommonCloudflareConstruct, props: ArgoTieredCachingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.ArgoTieredCaching(`${id}`, {
      ...props,
      zoneId,
    })
  }
}
