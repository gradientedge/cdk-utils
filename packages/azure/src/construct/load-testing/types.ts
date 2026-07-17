import {
  CommonAzureStackProps,
  LoadTestProps,
  NatGatewayProps,
  PublicIPAddressProps,
  SubnetProps,
  VirtualNetworkProps,
} from '../../index.js'

/**
 * Properties for the reusable Azure load testing construct.
 * @category Interface
 */
export interface AzureLoadTestingProps extends CommonAzureStackProps {
  /** Directory containing one or more Azure Load Testing YAML definitions. */
  loadTestConfigPath: string
  /** Load test resource configuration. */
  loadTest: LoadTestProps
  /** NAT gateway configuration. */
  loadTestingNatGateway: NatGatewayProps
  /** Public IP configuration. */
  loadTestingPublicIp: PublicIPAddressProps
  /** Subnet configuration. */
  loadTestingSubnet: SubnetProps
  /** Virtual network configuration. */
  loadTestingVirtualNetwork: VirtualNetworkProps
}
