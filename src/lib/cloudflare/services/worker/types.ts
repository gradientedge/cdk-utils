import { WorkersCronTriggerConfig } from '@cdktf/provider-cloudflare/lib/workers-cron-trigger'
import { WorkersCustomDomainConfig } from '@cdktf/provider-cloudflare/lib/workers-custom-domain'
import { WorkersRouteConfig } from '@cdktf/provider-cloudflare/lib/workers-route'
import { WorkersScriptConfig } from '@cdktf/provider-cloudflare/lib/workers-script'
import { WorkersKvConfig } from '@cdktf/provider-cloudflare/lib/workers-kv'
import { WorkersKvNamespaceConfig } from '@cdktf/provider-cloudflare/lib/workers-kv-namespace'

export interface WorkerDomainProps extends WorkersCustomDomainConfig {}
export interface WorkerRouteProps extends WorkersRouteConfig {}
export interface WorkerScriptProps extends WorkersScriptConfig {}
export interface WorkersKvNamespaceProps extends WorkersKvNamespaceConfig {}
export interface WorkersKvProps extends WorkersKvConfig {}
export interface WorkerCronTriggerProps extends WorkersCronTriggerConfig {}
