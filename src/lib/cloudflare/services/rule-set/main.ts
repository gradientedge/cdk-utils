import * as cloudflare from '@pulumi/cloudflare'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { RulesetProps } from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Rule Sets
 * - A new instance of this class is injected into {@link CommonCloudflareConstruct} constructor.
 * - If a custom construct extends {@link CommonCloudflareConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(parent: pulumi.ComponentResource, name: string, props: CommonCloudflareStackProps) {
 *     super(parent, name, props)
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
   * @see [Pulumi Cloudflare Ruleset]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/ruleset/}
   */
  public createRuleSet(id: string, scope: CommonCloudflareConstruct, props: RulesetProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    const ruleSet = new cloudflare.Ruleset(`${id}`, {
      ...props,
      zoneId,
    })

    return ruleSet
  }
}
