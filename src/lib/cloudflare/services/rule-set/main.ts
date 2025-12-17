import { Ruleset } from '@cdktf/provider-cloudflare/lib/ruleset/index.js'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { createCloudflareTfOutput } from '../../utils/index.js'
import { RulesetProps } from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Rule Sets
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
 *     this.ruleSetManager.createRuleSet('MyRule', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareRuleSetManager {
  /**
   * @summary Method to create a new Cloudflare Rule Set
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props rule set properties
   * @see [CDKTF Ruleset Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/ruleset.typescript.md}
   */
  public createRuleSet(id: string, scope: CommonCloudflareConstruct, props: RulesetProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const ruleSet = new Ruleset(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-ruleSetFriendlyUniqueId`, scope, ruleSet.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-ruleSetId`, scope, ruleSet.id)

    return ruleSet
  }
}
