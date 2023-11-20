import { WorkerCronTriggerConfig } from '@cdktf/provider-cloudflare/lib/worker-cron-trigger'
import { WorkerDomainConfig } from '@cdktf/provider-cloudflare/lib/worker-domain'
import { WorkerRouteConfig } from '@cdktf/provider-cloudflare/lib/worker-route'
import { WorkerScriptConfig } from '@cdktf/provider-cloudflare/lib/worker-script'
import { WorkersKvConfig } from '@cdktf/provider-cloudflare/lib/workers-kv'
import { WorkersKvNamespaceConfig } from '@cdktf/provider-cloudflare/lib/workers-kv-namespace'

export interface WorkerDomainProps extends WorkerDomainConfig {}
export interface WorkerRouteProps extends WorkerRouteConfig {}
export interface WorkerScriptProps extends WorkerScriptConfig {}
export interface WorkersKvNamespaceProps extends WorkersKvNamespaceConfig {}
export interface WorkersKvProps extends WorkersKvConfig {}
export interface WorkerCronTriggerProps extends WorkerCronTriggerConfig {}
