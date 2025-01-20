import { PageRuleConfig } from '@cdktf/provider-cloudflare/lib/page-rule'
import { PagesDomainConfig } from '@cdktf/provider-cloudflare/lib/pages-domain'
import { PagesProjectConfig } from '@cdktf/provider-cloudflare/lib/pages-project'

export interface PagesProjectProps extends PagesProjectConfig {}
export interface PagesDomainProps extends PagesDomainConfig {}
export interface PageRuleProps extends PageRuleConfig {}
export interface PagesProjectDeployProps {
  branch: string
  directory: string
  message: string
  projectName: string
  dependsOn?: any
}
