import { PageRuleArgs, PagesDomainArgs, PagesProjectArgs } from '@pulumi/cloudflare'

/** @category Interface */
export interface PagesProjectProps extends PagesProjectArgs {}
/** @category Interface */
export interface PagesDomainProps extends PagesDomainArgs {}
/** @category Interface */
export interface PageRuleProps extends PageRuleArgs {}
/** @category Interface */
export interface PagesProjectDeployProps {
  branch: string
  directory: string
  message: string
  projectName: string
  dependsOn?: any
}
