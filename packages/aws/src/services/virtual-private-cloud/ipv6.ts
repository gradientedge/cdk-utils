import { Fn } from 'aws-cdk-lib'
import {
  CfnEgressOnlyInternetGateway,
  CfnSubnet,
  CfnVPCCidrBlock,
  ISubnet,
  RouterType,
  Subnet,
  Vpc,
} from 'aws-cdk-lib/aws-ec2'
import _ from 'lodash'

import { CommonConstruct } from '../../common/index.js'

import { VpcProps } from './types.js'

/**
 * A VPC construct that provisions an IPv6-native VPC with dual-stack subnets.
 *
 * This construct extends the standard CDK {@link Vpc} to:
 * - Associate an Amazon-provided IPv6 CIDR block with the VPC
 * - Convert all subnets (public, private, isolated) to IPv6-native mode
 * - Add default IPv6 routes via the Internet Gateway (public subnets) and
 *   an Egress-Only Internet Gateway (private subnets)
 *
 * @see [CDK VPC Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ec2-readme.html}
 * @category Service
 */
export class Ipv6Vpc extends Vpc {
  /** The ID of the egress-only internet gateway created for private subnets */
  public egressOnlyInternetGatewayId: string

  /**
   * @summary Creates an IPv6-native VPC with dual-stack subnets
   * @param scope scope in which this resource is defined
   * @param id scoped id of the resource
   * @param props VPC configuration properties
   */
  constructor(scope: CommonConstruct, id: string, props: VpcProps) {
    super(scope, id, props)

    /* Associate an Amazon-provided IPv6 CIDR block with this VPC */
    const cfnVpcCidrBlock = new CfnVPCCidrBlock(this, `${id}-ipv6-cidr`, {
      amazonProvidedIpv6CidrBlock: true,
      vpcId: this.vpcId,
    })

    /* Divide the VPC IPv6 CIDR into /64 subnet blocks (max 256 subnets) */
    const subnetIpv6CidrBlocks = Fn.cidr(Fn.select(0, this.vpcIpv6CidrBlocks), 256, '64')

    /* Convert each subnet to IPv6-native mode: remove IPv4 CIDR, assign an IPv6 CIDR,
       disable public IPv4 auto-assignment, and enable IPv6 address auto-assignment */
    _.forEach([...this.publicSubnets, ...this.privateSubnets, ...this.isolatedSubnets], (subnet, index) => {
      subnet.node.addDependency(cfnVpcCidrBlock)
      const cfnSubnet = subnet.node.defaultChild as CfnSubnet
      cfnSubnet.cidrBlock = undefined
      cfnSubnet.mapPublicIpOnLaunch = false
      cfnSubnet.ipv6CidrBlock = Fn.select(index, subnetIpv6CidrBlocks)
      cfnSubnet.assignIpv6AddressOnCreation = true
      cfnSubnet.ipv6Native = true
    })

    /* Helper to add a default IPv6 route (::/0) to all subnets via the specified gateway */
    const addDefaultIpv6Routes = (subnets: ISubnet[], gatewayId: string, routerType: RouterType) =>
      subnets.forEach(subnet =>
        (subnet as Subnet).addRoute(`${id}-default-route`, {
          destinationIpv6CidrBlock: '::/0',
          enablesInternetConnectivity: true,
          routerId: gatewayId,
          routerType: routerType,
        })
      )

    /* Public subnets route IPv6 traffic through the Internet Gateway */
    if (this.internetGatewayId) {
      addDefaultIpv6Routes(this.publicSubnets, this.internetGatewayId, RouterType.GATEWAY)
    }

    if (_.isEmpty(this.privateSubnets)) {
      return
    }

    /* Private subnets use an Egress-Only Internet Gateway for outbound-only IPv6 access */
    const egressIgw = new CfnEgressOnlyInternetGateway(this, `${id}-eigw`, { vpcId: this.vpcId })
    this.egressOnlyInternetGatewayId = egressIgw.ref

    addDefaultIpv6Routes(this.privateSubnets, egressIgw.ref, RouterType.EGRESS_ONLY_INTERNET_GATEWAY)
  }
}
