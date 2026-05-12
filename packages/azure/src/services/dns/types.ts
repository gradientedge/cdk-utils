import { RecordSetArgs, ZoneArgs } from '@pulumi/azure-native/dns/index.js'

/**
 * Properties for creating a DNS zone
 * @see [Pulumi Azure Native DNS Zone]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/zone/}
 * @category Interface
 */
export interface DnsZoneProps extends ZoneArgs {}

/**
 * Properties for creating a DNS A record
 * @see [Pulumi Azure Native DNS Record Set]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/recordset/}
 * @category Interface
 */
export interface DnsARecordProps extends RecordSetArgs {}

/**
 * Properties for creating a DNS CNAME record
 * @see [Pulumi Azure Native DNS Record Set]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/recordset/}
 * @category Interface
 */
export interface DnsCnameRecordProps extends RecordSetArgs {}

/**
 * Properties for creating a DNS TXT record
 * @see [Pulumi Azure Native DNS Record Set]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/recordset/}
 * @category Interface
 */
export interface DnsTxtRecordProps extends RecordSetArgs {}
