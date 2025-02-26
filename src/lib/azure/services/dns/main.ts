import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { DnsZone } from '@cdktf/provider-azurerm/lib/dns-zone'
import { DnsARecord } from '@cdktf/provider-azurerm/lib/dns-a-record'
import { DnsCnameRecord } from '@cdktf/provider-azurerm/lib/dns-cname-record'
import { DnsTxtRecord } from '@cdktf/provider-azurerm/lib/dns-txt-record'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { DnsZoneProps, DnsARecordProps, DnsCnameRecordProps, DnsTxtRecordProps } from './types'

/**
 * @classdesc Provides operations on Azure DNS
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.dnsManager.createAppService('MyDnsZone', this, props)
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
   * @see [CDKTF DNS Zone Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/DnsZone.typescript.md}
   */
  public createDnsZone(id: string, scope: CommonAzureConstruct, props: DnsZoneProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-am-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const dnsZone = new DnsZone(scope, `${id}-dz`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-dnsZoneName`, scope, dnsZone.name)
    createAzureTfOutput(`${id}-dnsZoneFriendlyUniqueId`, scope, dnsZone.friendlyUniqueId)
    createAzureTfOutput(`${id}-dnsZoneId`, scope, dnsZone.id)

    return dnsZone
  }

  /**
   * @summary Method to create a new DNS A Record
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props dns a record properties
   * @see [CDKTF DNS A Record Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/DnsARecord.typescript.md}
   */
  public createDnsARecord(id: string, scope: CommonAzureConstruct, props: DnsARecordProps) {
    if (!props) throw `Props undefined for ${id}`

    const dnsARecord = new DnsARecord(scope, `${id}-da`, {
      ...props,
      ttl: props.ttl || 300,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-dnsARecordName`, scope, dnsARecord.name)
    createAzureTfOutput(`${id}-dnsARecordFriendlyUniqueId`, scope, dnsARecord.friendlyUniqueId)
    createAzureTfOutput(`${id}-dnsARecordId`, scope, dnsARecord.id)

    return dnsARecord
  }

  /**
   * @summary Method to create a new DNS CNAME Record
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props dns cname record properties
   * @see [CDKTF DNS CNAME Record Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/DnsCnameRecord.typescript.md}
   */
  public createDnsCnameRecord(id: string, scope: CommonAzureConstruct, props: DnsCnameRecordProps) {
    if (!props) throw `Props undefined for ${id}`

    const dnsCnameRecord = new DnsCnameRecord(scope, `${id}-dc`, {
      ...props,
      ttl: props.ttl || 300,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-dnsCnameRecordName`, scope, dnsCnameRecord.name)
    createAzureTfOutput(`${id}-dnsCnameRecordFriendlyUniqueId`, scope, dnsCnameRecord.friendlyUniqueId)
    createAzureTfOutput(`${id}-dnsCnameRecordId`, scope, dnsCnameRecord.id)

    return dnsCnameRecord
  }

  /**
   * @summary Method to create a new DNS TXT Record
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props dns txt record properties
   * @see [CDKTF DNS TXT Record Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/DnsCnameRecord.typescript.md}
   */
  public createDnsTxtRecord(id: string, scope: CommonAzureConstruct, props: DnsTxtRecordProps) {
    if (!props) throw `Props undefined for ${id}`

    const dnsTxtRecord = new DnsTxtRecord(scope, `${id}-dc`, {
      ...props,
      ttl: props.ttl || 300,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-dnsTxtRecordName`, scope, dnsTxtRecord.name)
    createAzureTfOutput(`${id}-dnsTxtRecordFriendlyUniqueId`, scope, dnsTxtRecord.friendlyUniqueId)
    createAzureTfOutput(`${id}-dnsTxtRecordId`, scope, dnsTxtRecord.id)

    return dnsTxtRecord
  }
}
