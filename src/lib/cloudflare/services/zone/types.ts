import { ZoneConfig } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneCacheReserveConfig } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve'
import { ZoneCacheVariantsConfig } from '@cdktf/provider-cloudflare/lib/zone-cache-variants'
import { ZoneDnssecConfig } from '@cdktf/provider-cloudflare/lib/zone-dnssec'
import { ZoneHoldConfig } from '@cdktf/provider-cloudflare/lib/zone-hold'
import { ZoneLockdownConfig } from '@cdktf/provider-cloudflare/lib/zone-lockdown'
import { ZoneSettingConfig } from '@cdktf/provider-cloudflare/lib/zone-setting'
import { ZoneDnsSettingsConfig } from '@cdktf/provider-cloudflare/lib/zone-dns-settings'
import { DataCloudflareZoneConfig } from '@cdktf/provider-cloudflare/lib/data-cloudflare-zone'

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
