import { Argo } from '@cdktf/provider-cloudflare/lib/argo'
import { CommonCloudflareConstruct } from '../../common'
import { createCloudflareTfOutput } from '../../utils'
import { ArgoProps } from './types'

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
   * @see [CDKTF Argo Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/argo.typescript.md}
   */
  public createArgo(id: string, scope: CommonCloudflareConstruct, props: ArgoProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const argo = new Argo(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-argoFriendlyUniqueId`, scope, argo.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-argoId`, scope, argo.id)

    return argo
  }
}
