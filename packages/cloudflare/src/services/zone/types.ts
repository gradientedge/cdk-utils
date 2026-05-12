import {
  GetZoneArgs,
  ZoneArgs,
  ZoneCacheReserveArgs,
  ZoneCacheVariantsArgs,
  ZoneDnssecArgs,
  ZoneDnsSettingsArgs,
  ZoneHoldArgs,
  ZoneLockdownArgs,
  ZoneSettingArgs,
} from '@pulumi/cloudflare'

/**
 * Properties for creating a Cloudflare Zone
 * @see [Pulumi Cloudflare Zone]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zone/}
 * @category Interface
 */
export interface ZoneProps extends ZoneArgs {}
/**
 * Properties for looking up an existing Cloudflare Zone
 * @see [Pulumi Cloudflare getZone]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/getzone/}
 * @category Interface
 */
export interface GetZoneProps extends GetZoneArgs {}
/**
 * Properties for creating a Cloudflare Zone Cache Reserve
 * @see [Pulumi Cloudflare ZoneCacheReserve]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonecachereserve/}
 * @category Interface
 */
export interface ZoneCacheReserveProps extends ZoneCacheReserveArgs {}
/**
 * Properties for creating Cloudflare Zone Cache Variants
 * @see [Pulumi Cloudflare ZoneCacheVariants]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonecachevariants/}
 * @category Interface
 */
export interface ZoneCacheVariantsProps extends ZoneCacheVariantsArgs {}
/**
 * Properties for creating Cloudflare Zone DNSSEC settings
 * @see [Pulumi Cloudflare ZoneDnssec]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonednssec/}
 * @category Interface
 */
export interface ZoneDnssecProps extends ZoneDnssecArgs {}
/**
 * Properties for creating a Cloudflare Zone Hold
 * @see [Pulumi Cloudflare ZoneHold]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonehold/}
 * @category Interface
 */
export interface ZoneHoldProps extends ZoneHoldArgs {}
/**
 * Properties for creating a Cloudflare Zone Lockdown
 * @see [Pulumi Cloudflare ZoneLockdown]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonelockdown/}
 * @category Interface
 */
export interface ZoneLockdownProps extends ZoneLockdownArgs {}
/**
 * Properties for creating Cloudflare Zone Settings
 * @see [Pulumi Cloudflare ZoneSetting]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonesetting/}
 * @category Interface
 */
export interface ZoneSettingProps extends ZoneSettingArgs {}
/**
 * Properties for creating Cloudflare Zone DNS Settings
 * @see [Pulumi Cloudflare ZoneDnsSettings]{@link https://www.pulumi.com/registry/packages/cloudflare/api-docs/zonednssettings/}
 * @category Interface
 */
export interface ZoneDnsSettingsProps extends ZoneDnsSettingsArgs {}
