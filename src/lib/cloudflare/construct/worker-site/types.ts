import { CommonCloudflareStackProps } from '../../common'
import { WorkerDomainProps, WorkerScriptProps, RulesetProps, ZoneProps, ZoneSettingProps } from '../../services'

export interface CloudflareWorkerSiteProps extends CommonCloudflareStackProps {
  siteSubDomain: string
  siteZone: ZoneProps
  siteWorkerScript: WorkerScriptProps
  siteWorkerDomain: WorkerDomainProps
  siteWorkerAsset: string
  siteRuleSet: RulesetProps
  siteZoneSetting: ZoneSettingProps
}
