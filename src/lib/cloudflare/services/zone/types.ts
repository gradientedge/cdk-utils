import { ZoneConfig } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneCacheReserveConfig } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve'
import { ZoneCacheVariantsConfig } from '@cdktf/provider-cloudflare/lib/zone-cache-variants'
import { ZoneDnssecConfig } from '@cdktf/provider-cloudflare/lib/zone-dnssec'
import { ZoneHoldConfig } from '@cdktf/provider-cloudflare/lib/zone-hold'
import { ZoneLockdownConfig } from '@cdktf/provider-cloudflare/lib/zone-lockdown'
import { ZoneSettingsOverrideConfig } from '@cdktf/provider-cloudflare/lib/zone-settings-override'

export interface ZoneProps extends ZoneConfig {}
export interface ZoneOptions {
  id?: string
  name?: string
}
export interface ZoneCacheReserveProps extends ZoneCacheReserveConfig {}
export interface ZoneCacheVariantsProps extends ZoneCacheVariantsConfig {}
export interface ZoneDnssecProps extends ZoneDnssecConfig {}
export interface ZoneHoldProps extends ZoneHoldConfig {}
export interface ZoneLockdownProps extends ZoneLockdownConfig {}
export interface ZoneSettingsOverrideProps extends ZoneSettingsOverrideConfig {}
