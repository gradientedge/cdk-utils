import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneProps } from './types'
import { createCloudflareTfOutput } from '../../utils'
import { CommonCloudflareConstruct } from '../../common'

/**
 * @classdesc Provides operations on Cloudflare Zone
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
 *     this.zoneManager.createZone('MyZone', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareZoneManager {
  /**
   * @summary Method to create a new zone
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone properties
   * @see [CDKTF Zone Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zone.typescript.md}
   */
  public createZone(id: string, scope: CommonCloudflareConstruct, props: ZoneProps) {
    if (!props) throw `Props undefined for ${id}`

    const zone = new Zone(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      zone: props.zone ?? scope.props.domainName,
    })

    createCloudflareTfOutput(`${id}-zoneName`, scope, zone.zone)
    createCloudflareTfOutput(`${id}-zoneFriendlyUniqueId`, scope, zone.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneId`, scope, zone.id)
  }
}
