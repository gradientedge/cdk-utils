import { RemovalPolicy } from 'aws-cdk-lib'
import { ISecurityGroup, IVpc, SubnetSelection } from 'aws-cdk-lib/aws-ec2'
import { FileSystem, LifecyclePolicy, OutOfInfrequentAccessPolicy, PerformanceMode } from 'aws-cdk-lib/aws-efs'
import _ from 'lodash'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'
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
    vpc: IVpc,
    accessPointOptions?: EfsAccessPointOptions[],
    securityGroup?: ISecurityGroup,
    vpcSubnets?: SubnetSelection
  ) {
    if (!props) throw `EFS props undefined for ${id}`

    const fileSystemId = props.provisionNewOnDeployment ? `${id}-${new Date().getMilliseconds()}` : `${id}`
    const fileSystem = new FileSystem(scope, `${fileSystemId}`, {
      ...props,
      fileSystemName: props.fileSystemName ? `${props.fileSystemName}-${scope.props.stage}` : undefined,
      lifecyclePolicy: props.lifecyclePolicy ?? LifecyclePolicy.AFTER_7_DAYS,
      outOfInfrequentAccessPolicy: props.outOfInfrequentAccessPolicy ?? OutOfInfrequentAccessPolicy.AFTER_1_ACCESS,
      performanceMode: props.performanceMode ?? PerformanceMode.GENERAL_PURPOSE,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
      securityGroup,
      vpc,
      vpcSubnets,
    })

    createCfnOutput(`${id}-fileSystemArn`, scope, fileSystem.fileSystemArn)
    createCfnOutput(`${id}-fileSystemId`, scope, fileSystem.fileSystemId)

    /* provision access points if specified */
    if (accessPointOptions && !_.isEmpty(accessPointOptions)) {
      for (const [index, accessPointOption] of accessPointOptions.entries()) {
        if (!accessPointOption.path) throw `Undefined access point path for option: [${accessPointOption}], id: [${id}]`
        const accessPoint = fileSystem.addAccessPoint(`${id}-ap-${index}`, {
          createAcl: accessPointOption.createAcl ?? DEFAULT_CREATE_ACL,
          path: accessPointOption.path,
          posixUser: accessPointOption.posixUser ?? DEFAULT_POSIX_USER,
        })

        createCfnOutput(`${id}-accessPointArn-${index}`, scope, accessPoint.accessPointArn)
        createCfnOutput(`${id}-accessPointId-${index}`, scope, accessPoint.accessPointId)
      }
    }

    return fileSystem
  }
}
