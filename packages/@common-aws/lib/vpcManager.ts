import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

const CommonVpcIdentifier = 'CommonVpc'

export class VpcManager {
  public createVpc(id: string, scope: CommonConstruct, props: CommonStackProps) {
    if (!props.vpc) throw 'Vpc props undefined'
    const vpc = new ec2.Vpc(scope, `${id}`, {
      maxAzs: props.vpc.maxAzs,
    })

    createCfnOutput(`${id}Id`, scope, vpc.vpcId)
    createCfnOutput(
      `${id}PublicSubnetIds`,
      scope,
      vpc.publicSubnets.map((subnet) => subnet.subnetId).toString()
    )
    createCfnOutput(
      `${id}PrivateSubnetIds`,
      scope,
      vpc.privateSubnets.map((subnet) => subnet.subnetId).toString()
    )
    createCfnOutput(
      `${id}PublicSubnetRouteTableIds`,
      scope,
      vpc.publicSubnets.map((subnet) => subnet.routeTable.routeTableId).toString()
    )
    createCfnOutput(
      `${id}PrivateSubnetRouteTableIds`,
      scope,
      vpc.privateSubnets.map((subnet) => subnet.routeTable.routeTableId).toString()
    )
    createCfnOutput(`${id}AvailabilityZones`, scope, vpc.availabilityZones.toString())

    return vpc
  }

  public createCommonVpc(scope: CommonConstruct, props: CommonStackProps) {
    const vpc = this.createVpc(CommonVpcIdentifier, scope, props)
    cdk.Tags.of(vpc).add('Name', CommonVpcIdentifier)

    return vpc
  }

  public retrieveCommonVpc(id: string, scope: CommonConstruct, props: CommonStackProps) {
    return ec2.Vpc.fromLookup(scope, `${id}`, { vpcName: CommonVpcIdentifier })
  }
}
