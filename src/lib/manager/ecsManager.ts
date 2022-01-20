import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import { CommonConstruct } from '../common/commonConstruct'
import { EcsClusterProps, EcsTaskProps } from '../types'
import { createCfnOutput } from '../utils'

/**
 * @stability stable
 * @category Containers
 * @summary Provides operations on AWS Elastic Container Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ecsManager.createEcsCluster('MyCluster', this, vpc)
 *   }
 * }
 *
 * @see [CDK ECS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs-readme.html}
 */
export class EcsManager {
  /**
   * @summary Method to create an ecs cluster
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {EcsClusterProps} props
   * @param {ec2.IVpc} vpc
   */
  public createEcsCluster(id: string, scope: CommonConstruct, props: EcsClusterProps, vpc: ec2.IVpc) {
    if (!props) throw `Ecs Cluster props undefined`

    const ecsCluster = new ecs.Cluster(scope, `${id}`, {
      clusterName: `${props.clusterName}-${scope.props.stage}`,
      vpc: vpc,
    })

    createCfnOutput(`${id}-clusterArn`, scope, ecsCluster.clusterArn)
    createCfnOutput(`${id}-clusterName`, scope, ecsCluster.clusterName)

    return ecsCluster
  }

  /**
   * @summary Method to create an ecs fargate task
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {EcsTaskProps} props
   * @param {ecs.ICluster} cluster
   * @param {iam.Role} role
   * @param {logs.ILogGroup} logGroup
   * @param {ecs.ContainerImage} containerImage
   * @param {Map<string, string>} environment
   */
  public createEcsFargateTask(
    id: string,
    scope: CommonConstruct,
    props: EcsTaskProps,
    cluster: ecs.ICluster,
    role: iam.Role,
    logGroup: logs.ILogGroup,
    containerImage: ecs.ContainerImage,
    environment?: any
  ) {
    if (!props) throw `EcsTask props undefined`

    const ecsTask = new ecs.TaskDefinition(scope, `${id}`, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: props.cpu,
      executionRole: role,
      family: `${props.family}-${scope.props.stage}`,
      memoryMiB: props.memoryMiB,
      networkMode: ecs.NetworkMode.AWS_VPC,
      taskRole: role,
    })

    ecsTask.addContainer('EcsContainer', {
      cpu: props.cpu ? parseInt(props.cpu) : undefined,
      disableNetworking: false,
      environment: environment,
      image: containerImage,
      logging: ecs.LogDriver.awsLogs({
        logGroup: logGroup,
        streamPrefix: `${id}`,
      }),
      memoryLimitMiB: props.memoryMiB ? parseInt(props.memoryMiB) : undefined,
      privileged: false,
    })

    createCfnOutput(`${id}-taskArn`, scope, ecsTask.taskDefinitionArn)

    return ecsTask
  }
}
