import { FirewallRule } from '@cdktf/provider-cloudflare/lib/firewall-rule/index.js'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { createCloudflareTfOutput } from '../../utils/index.js'
import { FirewallRuleProps } from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Firewall Rules
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
 *     this.firewallManager.createApiShield('MyFirewallRule', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareFirewallManager {
  /**
   * @summary Method to create a new Cloudflare Firewall Rule
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props firewall rule properties
   * @see [CDKTF Firewall Rule Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/firewallRule.typescript.md}
   */
  public createFirewallRule(id: string, scope: CommonCloudflareConstruct, props: FirewallRuleProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const firewallRule = new FirewallRule(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-firewallRuleFriendlyUniqueId`, scope, firewallRule.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-firewallRuleId`, scope, firewallRule.id)

    return firewallRule
  }
}
