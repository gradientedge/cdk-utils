import { CommonCloudflareStackProps } from '../../common'
import { WorkerDomainProps, WorkerScriptProps, RecordProps, ZoneProps } from '../../services'

export interface CloudflareWorkerSiteProps extends CommonCloudflareStackProps {
  siteSubDomain: string
  siteZone: ZoneProps
  siteWorkerScript: WorkerScriptProps
  siteWorkerDomain: WorkerDomainProps
  siteWorkerAsset: string
}
