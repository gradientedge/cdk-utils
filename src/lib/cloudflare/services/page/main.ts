import { PageRule } from '@cdktf/provider-cloudflare/lib/page-rule'
import { PagesDomain } from '@cdktf/provider-cloudflare/lib/pages-domain'
import { PagesProject } from '@cdktf/provider-cloudflare/lib/pages-project'
import { LocalExec, Provider } from 'cdktf-local-exec'
import { CommonCloudflareConstruct } from '../../common'
import { createCloudflareTfOutput } from '../../utils'
import { PageRuleProps, PagesDomainProps, PagesProjectDeployProps, PagesProjectProps } from './types'

/**
 * @classdesc Provides operations on Cloudflare Pages
 * - A new instance of this class is injected into {@link CommonCloudflareConstruct} constructor.
 * - If a custom construct extends {@link CommonCloudflareConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct, CommonCloudflareConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(parent: Construct, id: string, props: CommonCloudflareStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.pageManager.createPagesProject('MyPage', this, props)
 *   }
 * }
 * ```
 */
export class CloudflarePageManager {
  /**
   * @summary Method to create a new Cloudflare Pages Project
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props pages project properties
   * @see [CDKTF Pages Project Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/pagesProject.typescript.md}
   */
  public createPagesProject(id: string, scope: CommonCloudflareConstruct, props: PagesProjectProps) {
    if (!props) throw `Props undefined for ${id}`

    const pagesProject = new PagesProject(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      name: `${props.name}-${scope.props.stage}`,
    })

    createCloudflareTfOutput(`${id}-pagesProjectFriendlyUniqueId`, scope, pagesProject.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-pagesProjectId`, scope, pagesProject.id)

    return pagesProject
  }

  /**
   * @summary Method to create a new Cloudflare Pages Domain
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props pages domain properties
   * @see [CDKTF Pages Domain Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/pagesDomain.typescript.md}
   */
  public createPagesDomain(id: string, scope: CommonCloudflareConstruct, props: PagesDomainProps) {
    if (!props) throw `Props undefined for ${id}`

    const pagesDomain = new PagesDomain(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      name: props.name ?? scope.props.domainName,
    })

    createCloudflareTfOutput(`${id}-pagesDomainFriendlyUniqueId`, scope, pagesDomain.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-pagesDomainId`, scope, pagesDomain.id)

    return pagesDomain
  }

  /**
   * @summary Method to create a new Cloudflare Page Rule
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props page rule properties
   * @see [CDKTF Page Rule Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/pageRule.typescript.md}
   */
  public createPageRule(id: string, scope: CommonCloudflareConstruct, props: PageRuleProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id

    const pageRule = new PageRule(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-pageRuleFriendlyUniqueId`, scope, pageRule.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-pageRuleId`, scope, pageRule.id)

    return pageRule
  }

  public deployPagesProject(id: string, scope: CommonCloudflareConstruct, props: PagesProjectDeployProps) {
    if (!props) throw `Props undefined for ${id}`

    new Provider(scope, `${id}`)
    const message = process.env.BUILD_NUMBER ?? props.message
    const deployment = new LocalExec(scope, `${id}-deploy-${new Date().toISOString()}`, {
      command: `CLOUDFLARE_ACCOUNT_ID=${scope.props.accountId} CLOUDFLARE_API_TOKEN=${scope.props.apiToken} npx wrangler pages deploy ${props.directory} --project-name=${props.projectName} --branch=${props.branch} --commit-message=${message}`,
      cwd: '',
      dependsOn: props.dependsOn,
    })

    return deployment
  }
}
