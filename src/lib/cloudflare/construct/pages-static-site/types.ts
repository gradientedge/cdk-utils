import { CommonCloudflareStackProps } from '../../common'
import { PagesProjectProps, DnsRecordProps, ZoneProps } from '../../services'

export interface CloudflarePagesStaticSiteProps extends CommonCloudflareStackProps {
  siteAssetDir: string
  siteBranch?: string
  siteCnameRecord: DnsRecordProps
  siteDeployMessage: string
  sitePagesProject: PagesProjectProps
  siteSubDomain: string
  siteZone: ZoneProps
}
