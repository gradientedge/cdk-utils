import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'

/**
 * @stability stable
 * @category cdk-utils.vpc-manager
 * @subcategory Construct
 */
const CommonVpcIdentifier = 'CommonVpc'

/**
 * @category cdk-utils.vpc-manager
 * @subcategory Construct
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
 *
 * @see [CDK VPC Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.@aws-cdk_aws-ec2.Vpc.html}
 */
export class VpcManager {
  /**
   * @summary Method to create a new vpc
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {ec2.VpcProps} props
   */
  public createVpc(id: string, scope: CommonConstruct, props: ec2.VpcProps) {
    if (!props) throw `Vpc props undefined for ${id}`
    const vpc = new ec2.Vpc(scope, `${id}`, {
      maxAzs: props.maxAzs,
      ipAddresses: props.ipAddresses,
    })

    utils.createCfnOutput(`${id}Id`, scope, vpc.vpcId)
    utils.createCfnOutput(`${id}PublicSubnetIds`, scope, vpc.publicSubnets.map(subnet => subnet.subnetId).toString())
    utils.createCfnOutput(`${id}PrivateSubnetIds`, scope, vpc.privateSubnets.map(subnet => subnet.subnetId).toString())
    utils.createCfnOutput(
      `${id}PublicSubnetRouteTableIds`,
      scope,
      vpc.publicSubnets.map(subnet => subnet.routeTable.routeTableId).toString()
    )
    utils.createCfnOutput(
      `${id}PrivateSubnetRouteTableIds`,
      scope,
      vpc.privateSubnets.map(subnet => subnet.routeTable.routeTableId).toString()
    )
    utils.createCfnOutput(`${id}AvailabilityZones`, scope, vpc.availabilityZones.toString())
    utils.createCfnOutput(`${id}DefaultSecurityGroup`, scope, vpc.vpcDefaultSecurityGroup.toString())

    return vpc
  }

  /**
   * @summary Method to create a common vpc
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {ec2.VpcProps} props
   * @param {string?} vpcIdentifier optional identifier for VPC
   */
  public createCommonVpc(scope: CommonConstruct, props: ec2.VpcProps, vpcIdentifier?: string) {
    const vpc = this.createVpc(CommonVpcIdentifier, scope, props)
    cdk.Tags.of(vpc).add('Name', vpcIdentifier ?? CommonVpcIdentifier)

    return vpc
  }

  /**
   * @summary Method to retrieve a common vpc
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string?} vpcIdentifier optional identifier for VPC
   */
  public retrieveCommonVpc(id: string, scope: CommonConstruct, vpcIdentifier?: string) {
    return ec2.Vpc.fromLookup(scope, `${id}`, { vpcName: vpcIdentifier ?? CommonVpcIdentifier })
  }
}
