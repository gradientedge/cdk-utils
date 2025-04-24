import { DataCloudflareZone } from '@cdktf/provider-cloudflare/lib/data-cloudflare-zone'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneCacheReserve } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve'
import { ZoneCacheVariants } from '@cdktf/provider-cloudflare/lib/zone-cache-variants'
import { ZoneDnssec } from '@cdktf/provider-cloudflare/lib/zone-dnssec'
import { ZoneHold } from '@cdktf/provider-cloudflare/lib/zone-hold'
import { ZoneLockdown } from '@cdktf/provider-cloudflare/lib/zone-lockdown'
import { ZoneSetting } from '@cdktf/provider-cloudflare/lib/zone-setting'
import { ZoneDnsSettings } from '@cdktf/provider-cloudflare/lib/zone-dns-settings'
import { CommonCloudflareConstruct } from '../../common'
import { createCloudflareTfOutput } from '../../utils'
import {
  ZoneCacheReserveProps,
  ZoneCacheVariantsProps,
  ZoneDnssecProps,
  ZoneHoldProps,
  ZoneLockdownProps,
  ZoneOptions,
  ZoneProps,
  ZoneSettingProps,
} from './types'

/**
 * @classdesc Provides operations on Cloudflare Zone
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
   * @see [CDKTF Zone Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zone.typescript.md}
   */
  public createZone(id: string, scope: CommonCloudflareConstruct, props: ZoneProps) {
    if (!props) throw `Props undefined for ${id}`

    const zone = new Zone(scope, `${id}`, {
      ...props,
      account: {
        id: props.account.id ?? scope.props.accountId,
      },
      name: props.name ?? scope.props.domainName,
    })

    createCloudflareTfOutput(`${id}-zoneName`, scope, zone.name)
    createCloudflareTfOutput(`${id}-zoneFriendlyUniqueId`, scope, zone.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneId`, scope, zone.id)

    return zone
  }

  public resolveZone(id: string, scope: CommonCloudflareConstruct, options?: ZoneOptions) {
    const zone = new DataCloudflareZone(scope, `${id}-data-zone`, {
      filter: {
        account: {
          name: options?.name ?? scope.props.domainName,
        },
      },
      zoneId: options?.zoneId,
    })

    return zone
  }

  /**
   * @summary Method to create a new zone cache reserve
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone cache reserve properties
   * @see [CDKTF Zone Cache Reserve Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zoneCacheReserve.typescript.md}
   */
  public createZoneCacheReserve(id: string, scope: CommonCloudflareConstruct, props: ZoneCacheReserveProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : this.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id
    const zoneCacheReserve = new ZoneCacheReserve(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-zoneCacheReserveFriendlyUniqueId`, scope, zoneCacheReserve.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneCacheReserveId`, scope, zoneCacheReserve.id)

    return zoneCacheReserve
  }

  /**
   * @summary Method to create a new zone cache variants
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone cache variants properties
   * @see [CDKTF Zone Cache Variants Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zoneCacheVariants.typescript.md}
   */
  public createZoneCacheVariants(id: string, scope: CommonCloudflareConstruct, props: ZoneCacheVariantsProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : this.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id
    const zoneCacheVariants = new ZoneCacheVariants(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-zoneCacheVariantsFriendlyUniqueId`, scope, zoneCacheVariants.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneCacheVariantsId`, scope, zoneCacheVariants.id)

    return zoneCacheVariants
  }

  /**
   * @summary Method to create a new zone dnssec
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone dnssec properties
   * @see [CDKTF Zone DNS Security Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zoneDnssec.typescript.md}
   */
  public createZoneDnssec(id: string, scope: CommonCloudflareConstruct, props: ZoneDnssecProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : this.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id
    const zoneDnssec = new ZoneDnssec(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-zoneDnssecFriendlyUniqueId`, scope, zoneDnssec.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneDnssecId`, scope, zoneDnssec.id)

    return zoneDnssec
  }

  /**
   * @summary Method to create a new zone hold
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone hold properties
   * @see [CDKTF Zone Hold Security Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zoneHold.typescript.md}
   */
  public createZoneHold(id: string, scope: CommonCloudflareConstruct, props: ZoneHoldProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : this.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id
    const zoneHold = new ZoneHold(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-zoneHoldFriendlyUniqueId`, scope, zoneHold.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneHoldId`, scope, zoneHold.id)

    return zoneHold
  }

  /**
   * @summary Method to create a new zone lockdown
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone lockdown properties
   * @see [CDKTF Zone Lockdown Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zoneLockdown.typescript.md}
   */
  public createZoneLockdown(id: string, scope: CommonCloudflareConstruct, props: ZoneLockdownProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : this.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id
    const zoneLockdown = new ZoneLockdown(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-zoneLockdownFriendlyUniqueId`, scope, zoneLockdown.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneLockdownId`, scope, zoneLockdown.id)

    return zoneLockdown
  }

  /**
   * @summary Method to create new zone dns settings
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone dns settings properties
   * @see [CDKTF Zone Dns Settings Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/dnsZoneSettings.typescript.md}
   */
  public createZoneDnsSettings(id: string, scope: CommonCloudflareConstruct, props: ZoneSettingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : this.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id
    const zoneDnsSettings = new ZoneDnsSettings(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-zoneDnsSettingsFriendlyUniqueId`, scope, zoneDnsSettings.friendlyUniqueId)

    return zoneDnsSettings
  }

  /**
   * @summary Method to create a new zone setting
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props zone setting properties
   * @see [CDKTF Zone Setting Module]{@link https://github.com/cdktf/cdktf-provider-cloudflare/blob/main/docs/zoneSetting.typescript.md}
   */
  public createZoneSetting(id: string, scope: CommonCloudflareConstruct, props: ZoneSettingProps) {
    if (!props) throw `Props undefined for ${id}`

    const zoneId = props.zoneId
      ? props.zoneId
      : this.resolveZone(`${id}-data-zone`, scope, { name: scope.props.domainName })?.id
    const zoneSetting = new ZoneSetting(scope, `${id}`, {
      ...props,
      zoneId,
    })

    createCloudflareTfOutput(`${id}-zoneSettingFriendlyUniqueId`, scope, zoneSetting.friendlyUniqueId)
    createCloudflareTfOutput(`${id}-zoneSettingId`, scope, zoneSetting.id)

    return zoneSetting
  }
}
