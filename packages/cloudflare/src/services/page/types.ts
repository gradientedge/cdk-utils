import { PageRuleArgs, PagesDomainArgs, PagesProjectArgs } from '@pulumi/cloudflare'
import { Input } from '@pulumi/pulumi'

/**
 * Properties for creating a Cloudflare Pages Project
 * @see [Pulumi Cloudflare PagesProject]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/pagesproject/}
 * @category Interface
 */
export interface PagesProjectProps extends PagesProjectArgs {}
/**
 * Properties for creating a Cloudflare Pages Domain
 * @see [Pulumi Cloudflare PagesDomain]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/pagesdomain/}
 * @category Interface
 */
export interface PagesDomainProps extends PagesDomainArgs {}
/**
 * Properties for creating a Cloudflare Page Rule
 * @see [Pulumi Cloudflare PageRule]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/pagerule/}
 * @category Interface
 */
export interface PageRuleProps extends PageRuleArgs {}
/**
 * Properties for deploying a Cloudflare Pages project via wrangler CLI
 * @category Interface
 */
export interface PagesProjectDeployProps {
  /** The git branch to deploy */
  branch: string
  /** The directory containing the built assets to deploy */
  directory: string
  /** The deployment commit message */
  message: string
  /** The name of the Cloudflare Pages project to deploy to */
  projectName: Input<string>
  /** Optional resources that the deployment depends on */
  dependsOn?: any
}
