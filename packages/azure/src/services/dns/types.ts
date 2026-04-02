import { RecordSetArgs, ZoneArgs } from '@pulumi/azure-native/dns/index.js'

/** @category Interface */
export interface DnsZoneProps extends ZoneArgs {}

/** @category Interface */
export interface DnsARecordProps extends RecordSetArgs {}

/** @category Interface */
export interface DnsCnameRecordProps extends RecordSetArgs {}

/** @category Interface */
export interface DnsTxtRecordProps extends RecordSetArgs {}
