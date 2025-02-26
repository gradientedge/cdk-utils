import { DnsZoneConfig } from '@cdktf/provider-azurerm/lib/dns-zone'
import { DnsARecordConfig } from '@cdktf/provider-azurerm/lib/dns-a-record'
import { DnsCnameRecordConfig } from '@cdktf/provider-azurerm/lib/dns-cname-record'
import { DnsTxtRecordConfig } from '@cdktf/provider-azurerm/lib/dns-txt-record'

export interface DnsZoneProps extends DnsZoneConfig {}
export interface DnsARecordProps extends DnsARecordConfig {}
export interface DnsCnameRecordProps extends DnsCnameRecordConfig {}
export interface DnsTxtRecordProps extends DnsTxtRecordConfig {}
