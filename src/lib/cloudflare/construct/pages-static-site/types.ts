import { CommonCloudflareStackProps } from '../../common/index.js'
import { PagesProjectProps, DnsRecordProps, ZoneProps } from '../../services/index.js'

export interface CloudflarePagesStaticSiteProps extends CommonCloudflareStackProps {
  siteAssetDir: string
  siteBranch?: string
  siteCnameRecord: DnsRecordProps
  siteDeployMessage: string
  sitePagesProject: PagesProjectProps
  siteSubDomain: string
  siteZone: ZoneProps
}
