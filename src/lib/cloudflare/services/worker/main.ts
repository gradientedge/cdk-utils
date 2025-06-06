import { WorkersCustomDomain } from '@cdktf/provider-cloudflare/lib/workers-custom-domain'
import { WorkersRoute } from '@cdktf/provider-cloudflare/lib/workers-route'
import { WorkersScript } from '@cdktf/provider-cloudflare/lib/workers-script'
import { CommonCloudflareConstruct } from '../../common'
import { createCloudflareTfOutput } from '../../utils'
import {
  WorkerCronTriggerProps,
  WorkerDomainProps,
  WorkerRouteProps,
  WorkerScriptProps,
  WorkersKvNamespaceProps,
  WorkersKvProps,
} from './types'
import { WorkersKvNamespace } from '@cdktf/provider-cloudflare/lib/workers-kv-namespace'
import { WorkersKv } from '@cdktf/provider-cloudflare/lib/workers-kv'
import { WorkersCronTrigger } from '@cdktf/provider-cloudflare/lib/workers-cron-trigger'

/**
 * @classdesc Provides operations on Cloudflare Worker
 * - A new instance of this class is injected into {@link CommonCloudflareConstruct} constructor.
 * - If a custom construct extends {@link CommonCloudflareConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct, CommonCloudflareConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(parent: Construct, id: string, props: CommonCloudflareStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.workerManager.createWorkerDomain('MyWorkerDomain', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareWorkerManager {
  /**
   * @summary Method to create a new Cloudflare Worker Domain
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props worker domain properties
   * @see [CDKTF Worker Domain Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/workersCustomDomain.typescript.md}
   */
  public createWorkerDomain(id: string, scope: CommonCloudflareConstruct, props: WorkerDomainProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const workerDomain = new WorkersCustomDomain(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-workerDomainFriendlyUniqueId`, scope, workerDomain.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-workerDomainId`, scope, workerDomain.id)

    return workerDomain
  }

  /**
   * @summary Method to create a new Cloudflare Worker Route
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props worker route properties
   * @see [CDKTF Worker Route Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/workersRoute.typescript.md}
   */
  public createWorkerRoute(id: string, scope: CommonCloudflareConstruct, props: WorkerRouteProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.zoneId

    const workerRoute = new WorkersRoute(scope, `${id}`, {
      ...props,
      script: `${props.script}-${scope.props.stage}`,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-workerRouteFriendlyUniqueId`, scope, workerRoute.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-workerRouteId`, scope, workerRoute.id)

    return workerRoute
  }

  /**
   * @summary Method to create a new Cloudflare Worker Script
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props worker script properties
   * @see [CDKTF Worker Script Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/workersScript.typescript.md}
   */
  public createWorkerScript(id: string, scope: CommonCloudflareConstruct, props: WorkerScriptProps) {
    if (!props) throw `Props undefined for ${id}`

    const workerScript = new WorkersScript(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      scriptName: `${props.scriptName}-${scope.props.stage}`,
    })

    createCloudflareTfOutput(`${id}-workerScriptFriendlyUniqueId`, scope, workerScript.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-workerScriptId`, scope, workerScript.id)

    return workerScript
  }

  /**
   * @summary Method to create a new Cloudflare Workers KV Namespace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props workers kv namespace properties
   * @see [CDKTF Workers KV Namespace Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/workersKvNamespace.typescript.md}
   */
  public createWorkersKvNamespace(id: string, scope: CommonCloudflareConstruct, props: WorkersKvNamespaceProps) {
    if (!props) throw `Props undefined for ${id}`

    const workersKvNamespace = new WorkersKvNamespace(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      title: scope.isProductionStage() ? props.title : `${props.title}-${scope.props.stage}`,
    })

    createCloudflareTfOutput(`${id}-workersKvNamespaceFriendlyUniqueId`, scope, workersKvNamespace.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-workersKvNamespaceId`, scope, workersKvNamespace.id)

    return workersKvNamespace
  }

  /**
   * @summary Method to create a new Cloudflare Workers KV
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props workers kv properties
   * @see [CDKTF Workers KV Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/workersKv.typescript.md}
   */
  public createWorkersKv(id: string, scope: CommonCloudflareConstruct, props: WorkersKvProps) {
    if (!props) throw `Props undefined for ${id}`

    const workersKv = new WorkersKv(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
    })

    createCloudflareTfOutput(`${id}-workersKvFriendlyUniqueId`, scope, workersKv.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-workersKvId`, scope, workersKv.id)

    return workersKv
  }

  /**
   * @summary Method to create a new Cloudflare Worker Cron Trigger
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props workers cron trigger properties
   * @see [CDKTF Workers Cron Trigger Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/workersCronTrigger.typescript.md}
   */
  public createWorkerCronTrigger(id: string, scope: CommonCloudflareConstruct, props: WorkerCronTriggerProps) {
    if (!props) throw `Props undefined for ${id}`

    const workerCronTrigger = new WorkersCronTrigger(scope, `${id}`, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
    })

    createCloudflareTfOutput(`${id}-workerCronTriggerFriendlyUniqueId`, scope, workerCronTrigger.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-workerCronTriggerId`, scope, workerCronTrigger.id)

    return workerCronTrigger
  }
}
