import { WorkersCronTriggerConfig } from '@cdktf/provider-cloudflare/lib/workers-cron-trigger/index.js'
import { WorkersCustomDomainConfig } from '@cdktf/provider-cloudflare/lib/workers-custom-domain/index.js'
import { WorkersRouteConfig } from '@cdktf/provider-cloudflare/lib/workers-route/index.js'
import { WorkersScriptConfig } from '@cdktf/provider-cloudflare/lib/workers-script/index.js'
import { WorkersKvConfig } from '@cdktf/provider-cloudflare/lib/workers-kv/index.js'
import { WorkersKvNamespaceConfig } from '@cdktf/provider-cloudflare/lib/workers-kv-namespace/index.js'

export interface WorkerDomainProps extends WorkersCustomDomainConfig {}
export interface WorkerRouteProps extends WorkersRouteConfig {}
export interface WorkerScriptProps extends WorkersScriptConfig {}
export interface WorkersKvNamespaceProps extends WorkersKvNamespaceConfig {}
export interface WorkersKvProps extends WorkersKvConfig {}
export interface WorkerCronTriggerProps extends WorkersCronTriggerConfig {}
