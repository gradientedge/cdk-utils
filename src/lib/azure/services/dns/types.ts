import { RecordSetArgs, ZoneArgs } from '@pulumi/azure-native/dns/index.js'

export interface DnsZoneProps extends ZoneArgs {}

export interface DnsARecordProps extends RecordSetArgs {}

export interface DnsCnameRecordProps extends RecordSetArgs {}

export interface DnsTxtRecordProps extends RecordSetArgs {}
