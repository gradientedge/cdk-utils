import {
  WorkersCronTriggerArgs,
  WorkersCustomDomainArgs,
  WorkersKvArgs,
  WorkersKvNamespaceArgs,
  WorkersRouteArgs,
  WorkersScriptArgs,
} from '@pulumi/cloudflare'

/** @category Interface */
export interface WorkerDomainProps extends WorkersCustomDomainArgs {}

/** @category Interface */
export interface WorkerRouteProps extends WorkersRouteArgs {}

/** @category Interface */
export interface WorkerScriptProps extends WorkersScriptArgs {
  routes?: WorkerRouteProps[]
}

/** @category Interface */
export interface WorkersKvNamespaceProps extends WorkersKvNamespaceArgs {}

/** @category Interface */
export interface WorkersKvProps extends WorkersKvArgs {}

/** @category Interface */
export interface WorkerCronTriggerProps extends WorkersCronTriggerArgs {}
