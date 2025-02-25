import { DnsZoneConfig } from '@cdktf/provider-azurerm/lib/dns-zone'
import { DnsARecordConfig } from '@cdktf/provider-azurerm/lib/dns-a-record'
import { DnsCnameRecordConfig } from '@cdktf/provider-azurerm/lib/dns-cname-record'

export interface DnsZoneProps extends DnsZoneConfig {}
export interface DnsARecordProps extends DnsARecordConfig {}
export interface DnsCnameRecordProps extends DnsCnameRecordConfig {}
