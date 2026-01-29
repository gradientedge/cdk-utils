import { PageRule, PagesDomain, PagesProject } from '@pulumi/cloudflare'
import { local } from '@pulumi/command'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { PageRuleProps, PagesDomainProps, PagesProjectDeployProps, PagesProjectProps } from './types.js'

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
   * @see [Pulumi Cloudflare Pages Project]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/pagesproject/}
   */
  public createPagesProject(id: string, scope: CommonCloudflareConstruct, props: PagesProjectProps) {
    if (!props) throw `Props undefined for ${id}`

    return new PagesProject(
      `${id}`,
      {
        ...props,
        accountId: props.accountId ?? scope.props.accountId,
        name: `${props.name}-${scope.props.stage}`,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new Cloudflare Pages Domain
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props pages domain properties
   * @see [Pulumi Cloudflare Pages Domain]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/pagesdomain/}
   */
  public createPagesDomain(id: string, scope: CommonCloudflareConstruct, props: PagesDomainProps) {
    if (!props) throw `Props undefined for ${id}`

    return new PagesDomain(
      `${id}`,
      {
        ...props,
        accountId: props.accountId ?? scope.props.accountId,
        name: props.name ?? scope.props.domainName,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new Cloudflare Page Rule
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props page rule properties
   * @see [Pulumi Cloudflare Page Rule]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/pagerule/}
   */
  public createPageRule(id: string, scope: CommonCloudflareConstruct, props: PageRuleProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new PageRule(
      `${id}`,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }

  public deployPagesProject(id: string, scope: CommonCloudflareConstruct, props: PagesProjectDeployProps) {
    if (!props) throw `Props undefined for ${id}`

    const message = process.env.BUILD_NUMBER ?? props.message
    return new local.Command(
      `${id}-deploy-${new Date().toISOString()}`,
      {
        create: `CLOUDFLARE_ACCOUNT_ID=${scope.props.accountId} CLOUDFLARE_API_TOKEN=${scope.props.apiToken} npx wrangler pages deploy ${props.directory} --project-name=${props.projectName} --branch=${props.branch} --commit-message=${message}`,
        dir: '',
      },
      {
        dependsOn: props.dependsOn,
      }
    )
  }
}
