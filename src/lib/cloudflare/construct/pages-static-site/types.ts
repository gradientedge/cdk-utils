import { CommonCloudflareStackProps } from '../../common'
import { PagesProjectProps, RecordProps, ZoneProps } from '../../services'

export interface CloudflarePagesStaticSiteProps extends CommonCloudflareStackProps {
  siteAssetDir: string
  siteBranch?: string
  siteCnameRecord: RecordProps
  siteDeployMessage: string
  sitePagesProject: PagesProjectProps
  siteSubDomain: string
  siteZone: ZoneProps
}
