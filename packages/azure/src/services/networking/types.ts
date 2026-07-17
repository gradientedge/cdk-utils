import {
  NatGatewayArgs,
  PublicIPAddressArgs,
  SubnetArgs,
  VirtualNetworkArgs,
} from '@pulumi/azure-native/network/index.js'

/**
 * Properties for creating an Azure Virtual Network.
 * @see [Pulumi Azure Native Virtual Network]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/virtualnetwork/}
 * @category Interface
 */
export interface VirtualNetworkProps extends VirtualNetworkArgs {}

/**
 * Properties for creating an Azure Public IP Address.
 * @see [Pulumi Azure Native Public IP Address]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/publicipaddress/}
 * @category Interface
 */
export interface PublicIPAddressProps extends PublicIPAddressArgs {}

/**
 * Properties for creating an Azure NAT Gateway.
 * @see [Pulumi Azure Native NAT Gateway]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/natgateway/}
 * @category Interface
 */
export interface NatGatewayProps extends NatGatewayArgs {}

/**
 * Properties for creating an Azure Subnet.
 * @see [Pulumi Azure Native Subnet]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/network/subnet/}
 * @category Interface
 */
export interface SubnetProps extends SubnetArgs {}
