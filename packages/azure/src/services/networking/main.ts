import { NatGateway, PublicIPAddress, Subnet, VirtualNetwork } from '@pulumi/azure-native/network/index.js'
import * as pulumi from '@pulumi/pulumi'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { NatGatewayProps, PublicIPAddressProps, SubnetProps, VirtualNetworkProps } from './types.js'

/**
 * Provides operations on Azure networking resources using Pulumi.
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
 *     this.networkingManager.createVirtualNetwork('MyVirtualNetwork', this, props)
 *   }
 * }
 * ```
 * @category Service
 */
export class AzureNetworkingManager {
  /**
   * @summary Method to create a new virtual network
   */
  public createVirtualNetwork(
    id: string,
    scope: CommonAzureConstruct,
    props: VirtualNetworkProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName = props.resourceGroupName ?? scope.resourceGroup.name

    return new VirtualNetwork(
      `${id}-vnet`,
      {
        ...props,
        virtualNetworkName: scope.resourceNameFormatter.format(
          props.virtualNetworkName?.toString(),
          scope.props.resourceNameOptions?.virtualNetwork
        ),
        resourceGroupName,
        location: props.location ?? scope.props.location,
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new public IP address
   */
  public createPublicIPAddress(
    id: string,
    scope: CommonAzureConstruct,
    props: PublicIPAddressProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName = props.resourceGroupName ?? scope.resourceGroup.name
    const publicIpSku = pulumi.output(props.sku).apply(sku => ({
      ...sku,
      tier: sku?.tier ?? 'Regional',
    }))

    return new PublicIPAddress(
      `${id}-pip`,
      {
        ...props,
        publicIpAddressName: scope.resourceNameFormatter.format(
          props.publicIpAddressName?.toString(),
          scope.props.resourceNameOptions?.publicIpAddress
        ),
        resourceGroupName,
        location: props.location ?? scope.props.location,
        publicIPAddressVersion: props.publicIPAddressVersion ?? 'IPv4',
        sku: publicIpSku,
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new NAT gateway
   */
  public createNatGateway(
    id: string,
    scope: CommonAzureConstruct,
    props: NatGatewayProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName = props.resourceGroupName ?? scope.resourceGroup.name

    return new NatGateway(
      `${id}-ngw`,
      {
        ...props,
        natGatewayName: scope.resourceNameFormatter.format(
          props.natGatewayName?.toString(),
          scope.props.resourceNameOptions?.natGateway
        ),
        resourceGroupName,
        location: props.location ?? scope.props.location,
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new subnet
   */
  public createSubnet(id: string, scope: CommonAzureConstruct, props: SubnetProps, resourceOptions?: ResourceOptions) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName = props.resourceGroupName ?? scope.resourceGroup.name

    return new Subnet(
      `${id}-subnet`,
      {
        ...props,
        subnetName: scope.resourceNameFormatter.format(
          props.subnetName?.toString(),
          scope.props.resourceNameOptions?.subnet
        ),
        resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
