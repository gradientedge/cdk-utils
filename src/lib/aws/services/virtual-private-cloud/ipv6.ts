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
import { CommonConstruct } from '../../common'
import { VpcProps } from './types'

export class Ipv6Vpc extends Vpc {
  public egressOnlyInternetGatewayId: string

  constructor(scope: CommonConstruct, id: string, props: VpcProps) {
    super(scope, id, props)

    const cfnVpcCidrBlock = new CfnVPCCidrBlock(this, `${id}-ipv6-cidr`, {
      amazonProvidedIpv6CidrBlock: true,
      vpcId: this.vpcId,
    })

    const subnetIpv6CidrBlocks = Fn.cidr(Fn.select(0, this.vpcIpv6CidrBlocks), 256, '64')

    _.forEach([...this.publicSubnets, ...this.privateSubnets, ...this.isolatedSubnets], (subnet, index) => {
      subnet.node.addDependency(cfnVpcCidrBlock)
      const cfnSubnet = subnet.node.defaultChild as CfnSubnet
      cfnSubnet.cidrBlock = undefined
      cfnSubnet.mapPublicIpOnLaunch = false
      cfnSubnet.ipv6CidrBlock = Fn.select(index, subnetIpv6CidrBlocks)
      cfnSubnet.assignIpv6AddressOnCreation = true
      cfnSubnet.ipv6Native = true
    })

    const addDefaultIpv6Routes = (subnets: ISubnet[], gatewayId: string, routerType: RouterType) =>
      subnets.forEach(subnet =>
        (subnet as Subnet).addRoute(`${id}-default-route`, {
          destinationIpv6CidrBlock: '::/0',
          enablesInternetConnectivity: true,
          routerId: gatewayId,
          routerType: routerType,
        })
      )

    if (this.internetGatewayId) {
      addDefaultIpv6Routes(this.publicSubnets, this.internetGatewayId, RouterType.GATEWAY)
    }

    if (_.isEmpty(this.privateSubnets)) {
      return
    }

    const egressIgw = new CfnEgressOnlyInternetGateway(this, `${id}-eigw`, { vpcId: this.vpcId })
    this.egressOnlyInternetGatewayId = egressIgw.ref

    addDefaultIpv6Routes(this.privateSubnets, egressIgw.ref, RouterType.EGRESS_ONLY_INTERNET_GATEWAY)
  }
}
