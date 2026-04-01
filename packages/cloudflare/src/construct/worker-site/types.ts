import { CommonCloudflareStackProps } from '../../common/index.js'
import {
  WorkerDomainProps,
  WorkerScriptProps,
  RulesetProps,
  ZoneProps,
  ZoneSettingProps,
} from '../../services/index.js'

export interface CloudflareWorkerSiteProps extends CommonCloudflareStackProps {
  siteSubDomain: string
  siteZone: ZoneProps
  siteWorkerScript: WorkerScriptProps
  siteWorkerDomain: WorkerDomainProps
  siteWorkerAsset: string
  siteRuleSet: RulesetProps
  siteZoneSetting: ZoneSettingProps
}
