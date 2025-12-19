import * as cloudflare from '@pulumi/cloudflare'
import { CommonCloudflareConstruct } from '../../common/index.js'
import {
  WorkerCronTriggerProps,
  WorkerDomainProps,
  WorkerRouteProps,
  WorkerScriptProps,
  WorkersKvNamespaceProps,
  WorkersKvProps,
} from './types.js'

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
   * @see [Pulumi Worker Domain]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workercustomdomain/}
   */
  public createWorkerDomain(id: string, scope: CommonCloudflareConstruct, props: WorkerDomainProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id
    return new cloudflare.WorkersCustomDomain(id, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Worker Route
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props worker route properties
   * @see [Pulumi Worker Route]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workerroute/}
   */
  public createWorkerRoute(id: string, scope: CommonCloudflareConstruct, props: WorkerRouteProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : scope.zoneManager.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })?.id

    return new cloudflare.WorkersRoute(id, {
      ...props,
      script: `${props.script}-${scope.props.stage}`,
      zoneId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Worker Script
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props worker script properties
   * @see [Pulumi Worker Script]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workerscript/}
   */
  public createWorkerScript(id: string, scope: CommonCloudflareConstruct, props: WorkerScriptProps) {
    if (!props) throw `Props undefined for ${id}`

    return new cloudflare.WorkersScript(id, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      scriptName: `${props.scriptName}-${scope.props.stage}`,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Workers KV Namespace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props workers kv namespace properties
   * @see [Pulumi Workers KV Namespace]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workerskvnamespace/}
   */
  public createWorkersKvNamespace(id: string, scope: CommonCloudflareConstruct, props: WorkersKvNamespaceProps) {
    if (!props) throw `Props undefined for ${id}`

    return new cloudflare.WorkersKvNamespace(id, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
      title: scope.isProductionStage() ? props.title : `${props.title}-${scope.props.stage}`,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Workers KV
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props workers kv properties
   * @see [Pulumi Workers KV]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workerskv/}
   */
  public createWorkersKv(id: string, scope: CommonCloudflareConstruct, props: WorkersKvProps) {
    if (!props) throw `Props undefined for ${id}`

    return new cloudflare.WorkersKv(id, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
    })
  }

  /**
   * @summary Method to create a new Cloudflare Worker Cron Trigger
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props workers cron trigger properties
   * @see [Pulumi Workers Cron Trigger]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/workercrontrigger/}
   */
  public createWorkerCronTrigger(id: string, scope: CommonCloudflareConstruct, props: WorkerCronTriggerProps) {
    if (!props) throw `Props undefined for ${id}`

    return new cloudflare.WorkersCronTrigger(id, {
      ...props,
      accountId: props.accountId ?? scope.props.accountId,
    })
  }
}
