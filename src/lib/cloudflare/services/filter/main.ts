import { Filter } from '@pulumi/cloudflare'
import { CommonCloudflareConstruct } from '../../common/index.js'
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
 *     this.filterManager.createFilter('MyFilter', this, props)
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
   * @see [Pulumi Cloudflare Filter]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/filter/}
   */
  public createFilter(id: string, scope: CommonCloudflareConstruct, props: FilterProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new Filter(
      `${id}`,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }
}
