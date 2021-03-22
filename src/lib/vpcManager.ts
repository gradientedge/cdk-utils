import * as cdk from '@aws-cdk/core'
import * as ec2 from '@aws-cdk/aws-ec2'
import { CommonConstruct } from './commonConstruct'
import { createCfnOutput } from './genericUtils'

/**
 * @category Utils
 */
const CommonVpcIdentifier = 'CommonVpc'

/**
 * @category Networking & Content Delivery
 * @summary Provides operations on AWS VPC.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.vpcManager.createVpc('MyVPC', this)
 * }
 *
 * @see [CDK VPC Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-ec2.Vpc.html}</li></i>
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
