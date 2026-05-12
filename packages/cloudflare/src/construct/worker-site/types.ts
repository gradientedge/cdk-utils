import { CommonCloudflareStackProps } from '../../common/index.js'
import {
  WorkerDomainProps,
  WorkerScriptProps,
  RulesetProps,
  ZoneProps,
  ZoneSettingProps,
} from '../../services/index.js'

/**
 * Properties for the {@link CloudflareWorkerSite} construct
 * @category Interface
 */
export interface CloudflareWorkerSiteProps extends CommonCloudflareStackProps {
  /** The subdomain for the worker site (e.g. 'api' for api.example.com) */
  siteSubDomain: string
  /** The Cloudflare zone properties for the worker site */
  siteZone: ZoneProps
  /** The Cloudflare Workers script properties */
  siteWorkerScript: WorkerScriptProps
  /** The Cloudflare Workers custom domain properties */
  siteWorkerDomain: WorkerDomainProps
  /** The relative path to the worker script asset file */
  siteWorkerAsset: string
  /** The Cloudflare ruleset properties for the worker site */
  siteRuleSet: RulesetProps
  /** The Cloudflare zone setting properties for the worker site */
  siteZoneSetting: ZoneSettingProps
}
