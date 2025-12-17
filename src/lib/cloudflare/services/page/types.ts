import { PageRuleConfig } from '@cdktf/provider-cloudflare/lib/page-rule/index.js'
import { PagesDomainConfig } from '@cdktf/provider-cloudflare/lib/pages-domain/index.js'
import { PagesProjectConfig } from '@cdktf/provider-cloudflare/lib/pages-project/index.js'

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
