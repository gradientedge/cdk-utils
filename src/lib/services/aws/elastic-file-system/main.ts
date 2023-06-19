import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as efs from 'aws-cdk-lib/aws-efs'
import * as cdk from 'aws-cdk-lib'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import { EfsAccessPointOptions, EfsFileSystemProps } from './types'

export const DEFAULT_CREATE_ACL = {
  ownerGid: '1000',
  ownerUid: '1000',
  permissions: '755',
}

export const DEFAULT_POSIX_USER = {
  gid: '1000',
  uid: '1000',
}

/**
 * @classdesc Provides operations on AWS Elastic File System.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.efsManager.createFileSystem('MyFileSystem', this, fileSystemProps, vpc)
 *   }
 * }
 * @see [CDK EFS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_efs-readme.html}
 */
export class EfsManager {
  /**
   * @summary Method to create an efs file system
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the file system props
   * @param vpc the vpc to use for the file system
   * @param accessPointOptions optional access point configuration options for the file system
   * @param securityGroup optional security groups to configure for the file system
   * @param vpcSubnets optional subnets to configure for the file system
   */
  public createFileSystem(
    id: string,
    scope: CommonConstruct,
    props: EfsFileSystemProps,
    vpc: ec2.IVpc,
    accessPointOptions?: EfsAccessPointOptions[],
    securityGroup?: ec2.ISecurityGroup,
    vpcSubnets?: ec2.SubnetSelection
  ) {
    if (!props) throw `EFS props undefined for ${id}`

    const fileSystemId = props.provisionNewOnDeployment ? `${id}-${new Date().getMilliseconds()}` : `${id}`
    const fileSystem = new efs.FileSystem(scope, `${fileSystemId}`, {
      ...props,
      fileSystemName: props.fileSystemName ? `${props.fileSystemName}-${scope.props.stage}` : undefined,
      lifecyclePolicy: props.lifecyclePolicy ?? efs.LifecyclePolicy.AFTER_7_DAYS,
      outOfInfrequentAccessPolicy: props.outOfInfrequentAccessPolicy ?? efs.OutOfInfrequentAccessPolicy.AFTER_1_ACCESS,
      performanceMode: props.performanceMode ?? efs.PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: props.removalPolicy ?? cdk.RemovalPolicy.DESTROY,
      securityGroup,
      vpc,
      vpcSubnets,
    })

    utils.createCfnOutput(`${id}-fileSystemArn`, scope, fileSystem.fileSystemArn)
    utils.createCfnOutput(`${id}-fileSystemId`, scope, fileSystem.fileSystemId)

    /* provision access points if specified */
    if (accessPointOptions && accessPointOptions.length > 0) {
      for (const [index, accessPointOption] of accessPointOptions.entries()) {
        if (!accessPointOption.path) throw `Undefined access point path for option: [${accessPointOption}], id: [${id}]`
        const accessPoint = fileSystem.addAccessPoint(`${id}-ap-${index}`, {
          createAcl: accessPointOption.createAcl ?? DEFAULT_CREATE_ACL,
          path: accessPointOption.path,
          posixUser: accessPointOption.posixUser ?? DEFAULT_POSIX_USER,
        })

        utils.createCfnOutput(`${id}-accessPointArn-${index}`, scope, accessPoint.accessPointArn)
        utils.createCfnOutput(`${id}-accessPointId-${index}`, scope, accessPoint.accessPointId)
      }
    }

    return fileSystem
  }
}
