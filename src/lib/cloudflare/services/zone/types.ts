import { ZoneConfig } from '@cdktf/provider-cloudflare/lib/zone/index.js'
import { ZoneCacheReserveConfig } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve/index.js'
import { ZoneCacheVariantsConfig } from '@cdktf/provider-cloudflare/lib/zone-cache-variants/index.js'
import { ZoneDnssecConfig } from '@cdktf/provider-cloudflare/lib/zone-dnssec/index.js'
import { ZoneHoldConfig } from '@cdktf/provider-cloudflare/lib/zone-hold/index.js'
import { ZoneLockdownConfig } from '@cdktf/provider-cloudflare/lib/zone-lockdown/index.js'
import { ZoneSettingConfig } from '@cdktf/provider-cloudflare/lib/zone-setting/index.js'
import { ZoneDnsSettingsConfig } from '@cdktf/provider-cloudflare/lib/zone-dns-settings/index.js'
import { DataCloudflareZoneConfig } from '@cdktf/provider-cloudflare/lib/data-cloudflare-zone/index.js'

export interface ZoneProps extends ZoneConfig {}
export interface ZoneOptions extends DataCloudflareZoneConfig {
  id?: string
  name?: string
}
export interface ZoneCacheReserveProps extends ZoneCacheReserveConfig {}
export interface ZoneCacheVariantsProps extends ZoneCacheVariantsConfig {}
export interface ZoneDnssecProps extends ZoneDnssecConfig {}
export interface ZoneHoldProps extends ZoneHoldConfig {}
export interface ZoneLockdownProps extends ZoneLockdownConfig {}
export interface ZoneSettingProps extends ZoneSettingConfig {}
export interface ZoneDnsSettingsProps extends ZoneDnsSettingsConfig {}
