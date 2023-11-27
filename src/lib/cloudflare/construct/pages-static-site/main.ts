import { DataCloudflareZone } from '@cdktf/provider-cloudflare/lib/data-cloudflare-zone'
import { PagesDomain } from '@cdktf/provider-cloudflare/lib/pages-domain'
import { PagesProject } from '@cdktf/provider-cloudflare/lib/pages-project'
import { Record } from '@cdktf/provider-cloudflare/lib/record'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { Construct } from 'constructs'
import { CommonCloudflareConstruct } from '../../common'
import { CloudflarePagesStaticSiteProps } from './types'

/**
 * @classdesc Provides a construct to create and deploy a cloudflare pages static site
 * @example
 * import { CloudflarePagesStaticSite, CloudflareStaticSiteProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends CloudflarePagesStaticSite {
 *   constructor(parent: Construct, id: string, props: CloudflareStaticSiteProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class CloudflarePagesStaticSite extends CommonCloudflareConstruct {
  declare props: CloudflarePagesStaticSiteProps

  /* static site resources */
  sitePagesCnameRecord: Record
  sitePagesDomain: PagesDomain
  sitePagesProject: PagesProject
  siteZone: DataCloudflareZone | Zone

  constructor(parent: Construct, id: string, props: CloudflarePagesStaticSiteProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  protected initResources() {
    this.resolveZone()
    this.createProject()
    this.createDomain()
    this.createRecord()
    this.deploySite()
  }

  /**
   * @summary Resolve the zone to use for the static site
   */
  protected resolveZone() {
    if (this.props.useExistingZone) {
      this.siteZone = this.zoneManager.resolveZone(`${this.id}-zone`, this)
    } else {
      this.siteZone = this.zoneManager.createZone(`${this.id}-zone`, this, this.props.siteZone)
    }
  }

  /**
   * @summary Create the pages project
   */
  protected createProject() {
    this.sitePagesProject = this.pageManager.createPagesProject(
      `${this.id}-site-project`,
      this,
      this.props.sitePagesProject
    )
  }

  /**
   * @summary Create the pages domain
   */
  protected createDomain() {
    this.sitePagesDomain = this.pageManager.createPagesDomain(`${this.id}-site-domain`, this, {
      accountId: this.props.accountId,
      domain: `${this.props.siteSubDomain}.${this.props.domainName}`,
      projectName: this.sitePagesProject.name,
    })
  }

  /**
   * @summary Create the pages cname record
   */
  protected createRecord() {
    this.sitePagesCnameRecord = this.recordManager.createRecord(`${this.id}-site-record`, this, {
      ...this.props.siteCnameRecord,
      name: this.props.siteSubDomain,
      value: `${this.sitePagesProject.name}.pages.dev`,
    })
  }

  /**
   * @summary Deploy the pages project
   */
  protected deploySite() {
    this.pageManager.deployPagesProject(`${this.id}-deploy`, this, {
      branch: this.props.siteBranch ?? 'main',
      directory: this.props.siteAssetDir,
      message: this.props.siteDeployMessage,
      projectName: this.sitePagesProject.name,
    })
  }
}
