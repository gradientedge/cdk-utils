import {
  WorkersCronTriggerArgs,
  WorkersCustomDomainArgs,
  WorkersKvArgs,
  WorkersKvNamespaceArgs,
  WorkersRouteArgs,
  WorkersScriptArgs,
} from '@pulumi/cloudflare'

/**
 * Properties for creating a Cloudflare Workers Custom Domain
 * @see [Pulumi Cloudflare WorkersCustomDomain]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workercustomdomain/}
 * @category Interface
 */
export interface WorkerDomainProps extends WorkersCustomDomainArgs {}

/**
 * Properties for creating a Cloudflare Workers Route
 * @see [Pulumi Cloudflare WorkersRoute]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workerroute/}
 * @category Interface
 */
export interface WorkerRouteProps extends WorkersRouteArgs {}

/** @category Interface */
export interface WorkerScriptProps extends WorkersScriptArgs {
  /** Optional list of worker route configurations to create alongside the script */
  routes?: WorkerRouteProps[]
}

/**
 * Properties for creating a Cloudflare Workers KV Namespace
 * @see [Pulumi Cloudflare WorkersKvNamespace]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workerskvnamespace/}
 * @category Interface
 */
export interface WorkersKvNamespaceProps extends WorkersKvNamespaceArgs {}

/**
 * Properties for creating a Cloudflare Workers KV entry
 * @see [Pulumi Cloudflare WorkersKv]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workerskv/}
 * @category Interface
 */
export interface WorkersKvProps extends WorkersKvArgs {}

/**
 * Properties for creating a Cloudflare Workers Cron Trigger
 * @see [Pulumi Cloudflare WorkersCronTrigger]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workercrontrigger/}
 * @category Interface
 */
export interface WorkerCronTriggerProps extends WorkersCronTriggerArgs {}
