import { Tags } from 'aws-cdk-lib'
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
import { Ipv6Vpc } from './ipv6'
import { VpcProps } from './types'

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
    if (!props.vpcName) throw `Vpc vpcName undefined for ${id}`

    const vpcName = scope.resourceNameFormatter.format(props.vpcName, props.resourceNameOptions)
    let vpc
    if (props.isIPV6) {
      vpc = new Ipv6Vpc(scope, `${id}`, {
        ...props,
        subnetConfiguration: [
          { name: `${vpcName}-public`, subnetType: SubnetType.PUBLIC },
          { name: `${vpcName}-private`, subnetType: SubnetType.PRIVATE_WITH_EGRESS },
        ],
        vpcName,
      })
    } else {
      vpc = new Vpc(scope, `${id}`, {
        ...props,
        vpcName,
      })
    }

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
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param vpcIdentifier optional identifier for VPC
   */
  public createCommonVpc(id: string, scope: CommonConstruct, props: VpcProps, vpcIdentifier?: string) {
    const vpc = this.createVpc(id, scope, props)
    Tags.of(vpc).add(
      'Name',
      scope.resourceNameFormatter.format(vpcIdentifier ?? CommonVpcIdentifier, props.resourceNameOptions)
    )

    return vpc
  }

  /**
   * @summary Method to retrieve a common vpc
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param vpcIdentifier optional identifier for VPC
   */
  public retrieveCommonVpc(id: string, scope: CommonConstruct, vpcIdentifier?: string) {
    return Vpc.fromLookup(scope, `${id}`, {
      vpcName: scope.resourceNameFormatter.format(vpcIdentifier ?? CommonVpcIdentifier),
    })
  }
}
