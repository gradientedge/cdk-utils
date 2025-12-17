import { DnsRecord } from '@cdktf/provider-cloudflare/lib/dns-record/index.js'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { createCloudflareTfOutput } from '../../utils/index.js'
import { DnsRecordProps } from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Records
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
 *     this.recordManager.createRecord('MyRecord', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareRecordManager {
  /**
   * @summary Method to create a new Cloudflare Record
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props record properties
   * @see [CDKTF Record Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/dnsRecord.typescript.md}
   */
  public createRecord(id: string, scope: CommonCloudflareConstruct, props: DnsRecordProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const record = new DnsRecord(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-recordFriendlyUniqueId`, scope, record.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-recordId`, scope, record.id)

    return record
  }
}
