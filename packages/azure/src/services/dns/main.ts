import { RecordSet, Zone } from '@pulumi/azure-native/dns/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { DnsARecordProps, DnsCnameRecordProps, DnsTxtRecordProps, DnsZoneProps } from './types.js'

/**
 * @classdesc Provides operations on Azure DNS using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.dnsManager.createDnsZone('MyDnsZone', this, props)
 *   }
 * }
 * ```
 */
export class AzureDnsManager {
  /**
   * @summary Method to create a new DNS Zone
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props dns zone properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native DNS Zone]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/zone/}
   */
  public createDnsZone(
    id: string,
    scope: CommonAzureConstruct,
    props: DnsZoneProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

    return new Zone(
      `${id}-dz`,
      {
        ...props,
        zoneName: scope.resourceNameFormatter.format(
          props.zoneName?.toString(),
          scope.props.resourceNameOptions?.dnsZone
        ),
        resourceGroupName: resourceGroupName,
        location: 'global', // DNS zones are always global
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new DNS A Record
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props dns a record properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native DNS Record Set]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/recordset/}
   */
  public createDnsARecord(
    id: string,
    scope: CommonAzureConstruct,
    props: DnsARecordProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new RecordSet(
      `${id}-da`,
      {
        ...props,
        recordType: 'A',
        ttl: props.ttl ?? 300,
        metadata: props.metadata ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new DNS CNAME Record
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props dns cname record properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native DNS Record Set]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/recordset/}
   */
  public createDnsCnameRecord(
    id: string,
    scope: CommonAzureConstruct,
    props: DnsCnameRecordProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new RecordSet(
      `${id}-dc`,
      {
        ...props,
        recordType: 'CNAME',
        ttl: props.ttl ?? 300,
        metadata: props.metadata ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new DNS TXT Record
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props dns txt record properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native DNS Record Set]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/recordset/}
   */
  public createDnsTxtRecord(
    id: string,
    scope: CommonAzureConstruct,
    props: DnsTxtRecordProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new RecordSet(
      `${id}-dt`,
      {
        ...props,
        recordType: 'TXT',
        ttl: props.ttl ?? 300,
        metadata: props.metadata ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
