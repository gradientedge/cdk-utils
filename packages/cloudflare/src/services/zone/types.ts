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

export interface ZoneProps extends ZoneArgs {}
export interface GetZoneProps extends GetZoneArgs {}
export interface ZoneCacheReserveProps extends ZoneCacheReserveArgs {}
export interface ZoneCacheVariantsProps extends ZoneCacheVariantsArgs {}
export interface ZoneDnssecProps extends ZoneDnssecArgs {}
export interface ZoneHoldProps extends ZoneHoldArgs {}
export interface ZoneLockdownProps extends ZoneLockdownArgs {}
export interface ZoneSettingProps extends ZoneSettingArgs {}
export interface ZoneDnsSettingsProps extends ZoneDnsSettingsArgs {}
