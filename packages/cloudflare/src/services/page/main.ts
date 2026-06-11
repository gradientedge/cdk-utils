import { PageRule, PagesDomain, PagesProject } from '@pulumi/cloudflare'
import { local } from '@pulumi/command'
import * as pulumi from '@pulumi/pulumi'

import { CommonCloudflareConstruct } from '../../common/index.js'

import { PageRuleProps, PagesDomainProps, PagesProjectDeployProps, PagesProjectProps } from './types.js'

/* wrap a value in single quotes for safe use in a shell command */
const shellQuote = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`

/**
 * Provides operations on Cloudflare Pages
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
 * @category Service
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
    if (!props) throw new Error(`Props undefined for ${id}`)

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
    if (!props) throw new Error(`Props undefined for ${id}`)

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
    if (!props) throw new Error(`Props undefined for ${id}`)

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

  /**
   * @summary Method to deploy a Cloudflare Pages project using wrangler CLI
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the pages project deployment properties
   */
  public deployPagesProject(id: string, scope: CommonCloudflareConstruct, props: PagesProjectDeployProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    /* use build number from CI environment as the deploy message if available, otherwise fall back to props */
    const message = process.env.BUILD_NUMBER ?? props.message
    /* execute wrangler CLI command to deploy pages project assets - credentials are passed via the
       process environment rather than the command line to keep them out of rendered diffs and ps output */
    return new local.Command(
      `${id}-deploy-${new Date().toISOString()}`,
      {
        create: pulumi.interpolate`npx wrangler pages deploy ${shellQuote(props.directory)} --project-name=${pulumi
          .output(props.projectName)
          .apply(shellQuote)} --branch=${shellQuote(props.branch)} --commit-message=${shellQuote(message ?? '')}`,
        dir: '',
        environment: {
          CLOUDFLARE_ACCOUNT_ID: scope.props.accountId,
          CLOUDFLARE_API_TOKEN: scope.props.apiToken,
        },
      },
      {
        dependsOn: props.dependsOn,
      }
    )
  }
}
