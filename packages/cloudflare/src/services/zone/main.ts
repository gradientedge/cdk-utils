import {
  getZoneOutput,
  Zone,
  ZoneCacheReserve,
  ZoneCacheVariants,
  ZoneDnssec,
  ZoneHold,
  ZoneLockdown,
  ZoneSetting,
} from '@pulumi/cloudflare'

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
 * Provides operations on Cloudflare Zone using Pulumi
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
 * @category Service
 */
export class CloudflareZoneManager {
  /**
   * @summary Method to create a new zone
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone properties
   * @see [Pulumi Cloudflare Zone]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zone/}
   */
  public createZone(id: string, scope: CommonCloudflareConstruct, props: ZoneProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

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

  /**
   * @summary Method to resolve an existing Cloudflare zone by its domain name
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param options optional zone lookup properties
   * @see [Pulumi Cloudflare getZone]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/getzone/}
   */
  public resolveZone(id: string, scope: CommonCloudflareConstruct, options?: GetZoneProps) {
    const name = options?.filter?.name ?? scope.props.domainName
    return getZoneOutput({ filter: { name } }, { parent: scope })
  }

  /**
   * @summary Method to create a new zone cache reserve
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone cache reserve properties
   * @see [Pulumi Cloudflare ZoneCacheReserve]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonecachereserve/}
   */
  public createZoneCacheReserve(id: string, scope: CommonCloudflareConstruct, props: ZoneCacheReserveProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const zoneId =
      props.zoneId ?? this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } }).zoneId
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
   * @see [Pulumi Cloudflare ZoneCacheVariants]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonecachevariants/}
   */
  public createZoneCacheVariants(id: string, scope: CommonCloudflareConstruct, props: ZoneCacheVariantsProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const zoneId =
      props.zoneId ?? this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } }).zoneId
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
   * @see [Pulumi Cloudflare ZoneDnssec]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonednssec/}
   */
  public createZoneDnssec(id: string, scope: CommonCloudflareConstruct, props: ZoneDnssecProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const zoneId =
      props.zoneId ?? this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } }).zoneId
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
   * @see [Pulumi Cloudflare ZoneHold]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonehold/}
   */
  public createZoneHold(id: string, scope: CommonCloudflareConstruct, props: ZoneHoldProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const zoneId =
      props.zoneId ?? this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } }).zoneId
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
   * @see [Pulumi Cloudflare ZoneLockdown]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonelockdown/}
   */
  public createZoneLockdown(id: string, scope: CommonCloudflareConstruct, props: ZoneLockdownProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const zoneId =
      props.zoneId ?? this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } }).zoneId
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
   * @see [Pulumi Cloudflare ZoneSetting]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonesetting/}
   */
  public createZoneDnsSettings(id: string, scope: CommonCloudflareConstruct, props: ZoneSettingProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const zoneId =
      props.zoneId ?? this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } }).zoneId
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
   * @see [Pulumi Cloudflare ZoneSetting]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonesetting/}
   */
  public createZoneSetting(id: string, scope: CommonCloudflareConstruct, props: ZoneSettingProps) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const zoneId =
      props.zoneId ?? this.resolveZone(`${id}-data-zone`, scope, { filter: { name: scope.props.domainName } }).zoneId
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
