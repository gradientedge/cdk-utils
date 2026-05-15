import { CommonCloudflareStackProps } from '../../common/index.js'
import { PagesProjectProps, DnsRecordProps, ZoneProps } from '../../services/index.js'

/**
 * Properties for the {@link CloudflarePagesStaticSite} construct
 * @category Interface
 */
export interface CloudflarePagesStaticSiteProps extends CommonCloudflareStackProps {
  /** The local directory path containing the static site assets to deploy */
  siteAssetDir: string
  /** The git branch to deploy from, defaults to 'main' */
  siteBranch?: string
  /** The DNS CNAME record properties for the static site */
  siteCnameRecord?: DnsRecordProps
  /** The deployment message used when deploying the pages project */
  siteDeployMessage: string
  /** The Cloudflare Pages project properties */
  sitePagesProject: PagesProjectProps
  /** The subdomain for the static site (e.g. 'www' for www.example.com) */
  siteSubDomain: string
  /** The Cloudflare zone properties for the static site */
  siteZone: ZoneProps
}
