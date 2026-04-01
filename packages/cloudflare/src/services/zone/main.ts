import {
  Zone,
  ZoneCacheReserve,
  ZoneCacheVariants,
  ZoneDnssec,
  ZoneHold,
  ZoneLockdown,
  ZoneSetting,
} from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import { CommonCloudflareConstruct } from '../../common/index.js'
import {
  GetZoneProps,
  ZoneCacheReserveProps,
  ZoneCacheVariantsProps,
  ZoneDnssecProps,
  ZoneHoldProps,
  ZoneLockdownProps,
  ZoneProps,
  ZoneSettingProps,
} from './types.js'

/**
 * @classdesc Provides operations on Cloudflare Zone using Pulumi
 * - A new instance of this class is injected into {@link CommonCloudflareConstruct} constructor.
 * - If a custom construct extends {@link CommonCloudflareConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonCloudflareConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonCloudflareConstruct {
 *   constructor(parent: pulumi.ComponentResource, id: string, props: CommonCloudflareStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.zoneManager.createZone('MyZone', this, props)
 *   }
 * }
 * ```
 */
export class CloudflareZoneManager {
  /**
   * @summary Method to create a new zone
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone properties
   */
  public createZone(id: string, scope: CommonCloudflareConstruct, props: ZoneProps) {
    if (!props) throw `Props undefined for ${id}`

    return new Zone(
      id,
      {
        ...props,
        account: props.account ?? scope.props.accountId,
        name: scope.props.domainName,
      },
      { parent: scope }
    )
  }

  public resolveZone(id: string, scope: CommonCloudflareConstruct, options?: GetZoneProps) {
    const name = options?.filter?.name ?? scope.props.domainName
    return Zone.get(name, id)
  }

  /**
   * @summary Method to create a new zone cache reserve
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone cache reserve properties
   */
  public createZoneCacheReserve(id: string, scope: CommonCloudflareConstruct, props: ZoneCacheReserveProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId =
      props.zoneId ??
      pulumi.output(this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })).id
    return new ZoneCacheReserve(
      id,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new zone cache variants
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone cache variants properties
   */
  public createZoneCacheVariants(id: string, scope: CommonCloudflareConstruct, props: ZoneCacheVariantsProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId =
      props.zoneId ??
      pulumi.output(this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })).id
    return new ZoneCacheVariants(
      id,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new zone dnssec
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone dnssec properties
   */
  public createZoneDnssec(id: string, scope: CommonCloudflareConstruct, props: ZoneDnssecProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId =
      props.zoneId ??
      pulumi.output(this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })).id
    return new ZoneDnssec(
      id,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new zone hold
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone hold properties
   */
  public createZoneHold(id: string, scope: CommonCloudflareConstruct, props: ZoneHoldProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId =
      props.zoneId ??
      pulumi.output(this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })).id
    return new ZoneHold(
      id,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create a new zone lockdown
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone lockdown properties
   */
  public createZoneLockdown(id: string, scope: CommonCloudflareConstruct, props: ZoneLockdownProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId =
      props.zoneId ??
      pulumi.output(this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })).id
    return new ZoneLockdown(
      id,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }

  /**
   * @summary Method to create new zone dns settings
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone dns settings properties
   */
  public createZoneDnsSettings(id: string, scope: CommonCloudflareConstruct, props: ZoneSettingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId =
      props.zoneId ??
      pulumi.output(this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })).id
    const zoneDnsSettings = new ZoneSetting(
      id,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )

    return zoneDnsSettings
  }

  /**
   * @summary Method to create a new zone setting
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone setting properties
   */
  public createZoneSetting(id: string, scope: CommonCloudflareConstruct, props: ZoneSettingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId =
      props.zoneId ??
      pulumi.output(this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } })).id
    return new ZoneSetting(
      id,
      {
        ...props,
        zoneId,
      },
      { parent: scope }
    )
  }
}
