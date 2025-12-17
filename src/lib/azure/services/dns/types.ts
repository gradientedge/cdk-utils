import { DnsZoneConfig } from '@cdktf/provider-azurerm/lib/dns-zone/index.js'
import { DnsARecordConfig } from '@cdktf/provider-azurerm/lib/dns-a-record/index.js'
import { DnsCnameRecordConfig } from '@cdktf/provider-azurerm/lib/dns-cname-record/index.js'
import { DnsTxtRecordConfig } from '@cdktf/provider-azurerm/lib/dns-txt-record/index.js'

export interface DnsZoneProps extends DnsZoneConfig {}
export interface DnsARecordProps extends DnsARecordConfig {}
export interface DnsCnameRecordProps extends DnsCnameRecordConfig {}
export interface DnsTxtRecordProps extends DnsTxtRecordConfig {}
