import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import { CommonConstruct } from './commonConstruct'
import { EcsClusterProps, EcsTaskProps } from './types'
import { createCfnOutput } from './genericUtils'

/**
 * @category Containers
 * @summary Provides operations on AWS Elastic Container Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils/lib/commonConstruct'
 * import { CommonStackProps } from '@gradientedge/cdk-utils/lib/types'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ecsManager.createEcsCluster('MyCluster', this, vpc)
 * }
 *
 * @see [CDK ECS Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-ecs-readme.html}</li></i>
 */
export class EcsManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {ec2.IVpc} vpc
   */
  public createEcsCluster(id: string, scope: CommonConstruct, vpc: ec2.IVpc) {
    if (!scope.props.ecsClusters || scope.props.ecsClusters.length == 0)
      throw `Ecs Cluster props undefined`

    const ecsClusterProps = scope.props.ecsClusters.find((ecs: EcsClusterProps) => ecs.id === id)
    if (!ecsClusterProps) throw `Could not find EcsCluster props for id:${id}`

    const ecsCluster = new ecs.Cluster(scope, `${id}`, {
      clusterName: `${ecsClusterProps.clusterName}-${scope.props.stage}`,
      vpc: vpc,
    })

    createCfnOutput(`${id}Arn`, scope, ecsCluster.clusterArn)
    createCfnOutput(`${id}Name`, scope, ecsCluster.clusterName)

    return ecsCluster
  }

  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {ecs.ICluster} cluster
   * @param {iam.Role} role
   * @param {logs.ILogGroup} logGroup
   * @param {ecs.ContainerImage} containerImage
   * @param {Map<string, string>} environment
   */
  public createEcsFargateTask(
    id: string,
    scope: CommonConstruct,
    cluster: ecs.ICluster,
    role: iam.Role,
    logGroup: logs.ILogGroup,
    containerImage: ecs.ContainerImage,
    environment?: any
  ) {
    if (!scope.props.ecsTasks || scope.props.ecsTasks.length == 0) throw `Ecs Task props undefined`

    const ecsTaskProps = scope.props.ecsTasks.find((ecs: EcsTaskProps) => ecs.id === id)
    if (!ecsTaskProps) throw `Could not find EcsTask props for id:${id}`

    const ecsTask = new ecs.TaskDefinition(scope, `${id}`, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: ecsTaskProps.cpu,
      executionRole: role,
      family: `${ecsTaskProps.family}-${scope.props.stage}`,
      memoryMiB: ecsTaskProps.memoryMiB,
      networkMode: ecs.NetworkMode.AWS_VPC,
      taskRole: role,
    })

    ecsTask.addContainer('EcsContainer', {
      cpu: ecsTaskProps.cpu ? parseInt(ecsTaskProps.cpu) : undefined,
      disableNetworking: false,
      environment: environment,
      image: containerImage,
      logging: ecs.LogDriver.awsLogs({
        logGroup: logGroup,
        streamPrefix: `${id}`,
      }),
      memoryLimitMiB: ecsTaskProps.memoryMiB ? parseInt(ecsTaskProps.memoryMiB) : undefined,
      privileged: false,
    })

    createCfnOutput(`${id}Arn`, scope, ecsTask.taskDefinitionArn)

    return ecsTask
  }
}
