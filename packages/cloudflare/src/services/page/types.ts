import { PageRuleArgs, PagesDomainArgs, PagesProjectArgs } from '@pulumi/cloudflare'

export interface PagesProjectProps extends PagesProjectArgs {}
export interface PagesDomainProps extends PagesDomainArgs {}
export interface PageRuleProps extends PageRuleArgs {}
export interface PagesProjectDeployProps {
  branch: string
  directory: string
  message: string
  projectName: string
  dependsOn?: any
}
