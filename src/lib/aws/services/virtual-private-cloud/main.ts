import { Tags } from 'aws-cdk-lib'
import { Vpc, VpcProps } from 'aws-cdk-lib/aws-ec2'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import _ from 'lodash'

/**
 */
const CommonVpcIdentifier = 'CommonVpc'

/**
 * @classdesc Provides operations on AWS VPC.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.vpcManager.createVpc('MyVPC', this)
 *   }
 * }
 * @see [CDK VPC Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.@aws-cdk_aws-Vpc.html}
 */
export class VpcManager {
  /**
   * @summary Method to create a new vpc
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   */
  public createVpc(id: string, scope: CommonConstruct, props: VpcProps) {
    if (!props) throw `Vpc props undefined for ${id}`
    const vpc = new Vpc(scope, `${id}`, {
      ...props,
    })

    createCfnOutput(`${id}Id`, scope, vpc.vpcId)
    createCfnOutput(`${id}PublicSubnetIds`, scope, _.map(vpc.publicSubnets, subnet => subnet.subnetId).toString())
    createCfnOutput(`${id}PrivateSubnetIds`, scope, _.map(vpc.privateSubnets, subnet => subnet.subnetId).toString())
    createCfnOutput(
      `${id}PublicSubnetRouteTableIds`,
      scope,
      _.map(vpc.publicSubnets, subnet => subnet.routeTable.routeTableId).toString()
    )
    createCfnOutput(
      `${id}PrivateSubnetRouteTableIds`,
      scope,
      _.map(vpc.privateSubnets, subnet => subnet.routeTable.routeTableId).toString()
    )
    createCfnOutput(`${id}AvailabilityZones`, scope, vpc.availabilityZones.toString())
    createCfnOutput(`${id}DefaultSecurityGroup`, scope, vpc.vpcDefaultSecurityGroup.toString())

    return vpc
  }

  /**
   * @summary Method to create a common vpc
   * @param scope scope in which this resource is defined
   * @param props
   * @param vpcIdentifier optional identifier for VPC
   */
  public createCommonVpc(scope: CommonConstruct, props: VpcProps, vpcIdentifier?: string) {
    const vpc = this.createVpc(CommonVpcIdentifier, scope, props)
    Tags.of(vpc).add('Name', vpcIdentifier ?? CommonVpcIdentifier)

    return vpc
  }

  /**
   * @summary Method to retrieve a common vpc
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param vpcIdentifier optional identifier for VPC
   */
  public retrieveCommonVpc(id: string, scope: CommonConstruct, vpcIdentifier?: string) {
    return Vpc.fromLookup(scope, `${id}`, { vpcName: vpcIdentifier ?? CommonVpcIdentifier })
  }
}
