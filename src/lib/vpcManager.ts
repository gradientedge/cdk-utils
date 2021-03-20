import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import { CommonConstruct } from './commonConstruct'
import { createCfnOutput } from './genericUtils'

/**
 *
 */
const CommonVpcIdentifier = 'CommonVpc'

/**
 *
 */
export class VpcManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createVpc(id: string, scope: CommonConstruct) {
    if (!scope.props.vpc) throw 'Vpc props undefined'
    const vpc = new ec2.Vpc(scope, `${id}`, {
      maxAzs: scope.props.vpc.maxAzs,
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

  /**
   *
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public createCommonVpc(scope: CommonConstruct) {
    const vpc = this.createVpc(CommonVpcIdentifier, scope)
    cdk.Tags.of(vpc).add('Name', CommonVpcIdentifier)

    return vpc
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   */
  public retrieveCommonVpc(id: string, scope: CommonConstruct) {
    return ec2.Vpc.fromLookup(scope, `${id}`, { vpcName: CommonVpcIdentifier })
  }
}
