import {
  WorkersCronTriggerArgs,
  WorkersCustomDomainArgs,
  WorkersKvArgs,
  WorkersKvNamespaceArgs,
  WorkersRouteArgs,
  WorkersScriptArgs,
} from '@pulumi/cloudflare'

export interface WorkerDomainProps extends WorkersCustomDomainArgs {}
export interface WorkerRouteProps extends WorkersRouteArgs {}
export interface WorkerScriptProps extends WorkersScriptArgs {}
export interface WorkersKvNamespaceProps extends WorkersKvNamespaceArgs {}
export interface WorkersKvProps extends WorkersKvArgs {}
export interface WorkerCronTriggerProps extends WorkersCronTriggerArgs {}
