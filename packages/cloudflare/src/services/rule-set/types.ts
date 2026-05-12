import * as cloudflare from '@pulumi/cloudflare'

/**
 * Properties for creating a Cloudflare Ruleset
 * @see [Pulumi Cloudflare Ruleset]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/ruleset/}
 * @category Interface
 */
export interface RulesetProps extends cloudflare.RulesetArgs {}
