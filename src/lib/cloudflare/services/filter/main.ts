import { Filter } from '@cdktf/provider-cloudflare/lib/filter/index.js'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { createCloudflareTfOutput } from '../../utils/index.js'
import { FilterProps } from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Filters
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
 *     this.filterManager.createApiShield('MyFilter', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareFilterManager {
  /**
   * @summary Method to create a new Cloudflare Filter
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props filter properties
   * @see [CDKTF Filter Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/filter.typescript.md}
   */
  public createApiShield(id: string, scope: CommonCloudflareConstruct, props: FilterProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const filter = new Filter(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-filterFriendlyUniqueId`, scope, filter.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-filterId`, scope, filter.id)

    return filter
  }
}
