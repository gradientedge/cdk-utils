import { Duration, Tags } from 'aws-cdk-lib'
import { IVpc } from 'aws-cdk-lib/aws-ec2'
import {
  Cluster,
  Compatibility,
  ContainerImage,
  CpuArchitecture,
  ICluster,
  LogDriver,
  NetworkMode,
  OperatingSystemFamily,
  TaskDefinition,
} from 'aws-cdk-lib/aws-ecs'
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns'
import { Role } from 'aws-cdk-lib/aws-iam'
import { ILogGroup } from 'aws-cdk-lib/aws-logs'
import _ from 'lodash'

import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput } from '../../utils/index.js'

import { EcsApplicationLoadBalancedFargateServiceProps, EcsClusterProps, EcsTaskProps } from './types.js'

/**
 * Provides operations on AWS Elastic Container Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ecsManager.createEcsCluster('MyCluster', this, vpc)
 *   }
 * }
 * @see [CDK ECS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs-readme.html}
 * @category Service
 */
export class EcsManager {
  /**
   * @summary Method to create an ecs cluster
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the ECS cluster properties
   * @param vpc the VPC in which the cluster will be created
   */
  public createEcsCluster(id: string, scope: CommonConstruct, props: EcsClusterProps, vpc: IVpc) {
    if (!props) throw new Error(`Ecs Cluster props undefined for ${id}`)

    const ecsCluster = new Cluster(scope, `${id}`, {
      ...props,
      clusterName: `${props.clusterName}-${scope.props.stage}`,
      vpc,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(ecsCluster).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-clusterArn`, scope, ecsCluster.clusterArn)
    createCfnOutput(`${id}-clusterName`, scope, ecsCluster.clusterName)

    return ecsCluster
  }

  /**
   * @summary Method to create an ecs fargate task
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the ECS task definition properties
   * @param cluster the ECS cluster to associate with the task
   * @param role the IAM role for task execution and task role
   * @param logGroup the CloudWatch log group for container logging
   * @param containerImage the container image to use for the task
   * @param environment optional environment variables for the container
   * @param secrets optional secret values to inject into the container
   * @param command optional command to override the container entrypoint
   */
  public createEcsFargateTask(
    id: string,
    scope: CommonConstruct,
    props: EcsTaskProps,
    cluster: ICluster,
    role: Role,
    logGroup: ILogGroup,
    containerImage: ContainerImage,
    environment?: any,
    secrets?: any,
    command?: string[]
  ) {
    if (!props) throw new Error(`EcsTask props undefined for ${id}`)

    /* Create a Fargate-compatible task definition with AWS VPC networking */
    const ecsTask = new TaskDefinition(scope, `${id}`, {
      ...props,
      compatibility: Compatibility.FARGATE,
      executionRole: role,
      family: `${props.family}-${scope.props.stage}`,
      networkMode: NetworkMode.AWS_VPC,
      runtimePlatform: {
        cpuArchitecture: props.runtimePlatform?.cpuArchitecture ?? CpuArchitecture.X86_64,
        operatingSystemFamily: props.runtimePlatform?.operatingSystemFamily ?? OperatingSystemFamily.LINUX,
      },
      taskRole: role,
    })

    /* Add the primary container to the task definition with logging and resource limits */
    ecsTask.addContainer('EcsContainer', {
      command,
      cpu: props.cpu ? parseInt(props.cpu) : undefined,
      disableNetworking: false,
      environment,
      image: containerImage,
      logging: LogDriver.awsLogs({
        logGroup,
        logRetention: props.logging?.logRetention,
        multilinePattern: props.logging?.multilinePattern,
        streamPrefix: `${id}`,
      }),
      memoryLimitMiB: props.memoryMiB ? parseInt(props.memoryMiB) : undefined,
      privileged: false,
      secrets,
    })

    if (props.tags && !_.isEmpty(props.tags)) {
      _.forEach(props.tags, tag => {
        Tags.of(ecsTask).add(tag.key, tag.value)
      })
    }

    createCfnOutput(`${id}-taskArn`, scope, ecsTask.taskDefinitionArn)

    return ecsTask
  }

  /**
   * @summary Method to create an application load balanced ecs fargate task
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the Application Load Balanced Fargate service properties
   * @param cluster the ECS cluster to deploy the service into
   * @param logGroup the CloudWatch log group for container logging
   */
  public createLoadBalancedFargateService(
    id: string,
    scope: CommonConstruct,
    props: EcsApplicationLoadBalancedFargateServiceProps,
    cluster: ICluster,
    logGroup: ILogGroup
  ) {
    if (!props) throw new Error(`Ecs Load balanced Fargate Service props undefined for ${id}`)
    if (!props.loadBalancerName) throw new Error(`Ecs loadBalancerName undefined for ${id}`)
    if (!props.serviceName) throw new Error(`Ecs serviceName undefined for ${id}`)
    if (!props.taskImageOptions)
      throw new Error(`TaskImageOptions for Ecs Load balanced Fargate Service props undefined for ${id}`)

    const fargateService = new ApplicationLoadBalancedFargateService(scope, `${id}-ecs-service`, {
      ...props,
      assignPublicIp: props.assignPublicIp ?? true,
      cluster,
      enableECSManagedTags: true,
      healthCheckGracePeriod: props.healthCheckGracePeriod ?? Duration.seconds(60),
      loadBalancerName: scope.resourceNameFormatter.format(
        props.loadBalancerName,
        scope.props.resourceNameOptions?.ecs
      ),
      runtimePlatform: {
        cpuArchitecture: props.runtimePlatform?.cpuArchitecture ?? CpuArchitecture.X86_64,
        operatingSystemFamily: props.runtimePlatform?.operatingSystemFamily ?? OperatingSystemFamily.LINUX,
      },
      serviceName: scope.resourceNameFormatter.format(props.serviceName, scope.props.resourceNameOptions?.ecs),
      taskImageOptions: {
        ...props.taskImageOptions,
        enableLogging: props.taskImageOptions?.enableLogging ?? true,
        logDriver:
          props.taskImageOptions?.logDriver ??
          LogDriver.awsLogs({
            logGroup: logGroup,
            logRetention: props.logging?.logRetention,
            multilinePattern: props.logging?.multilinePattern,
            streamPrefix: `${id}-${scope.props.stage}/ecs`,
          }),
      },
    })

    /* Configure target group health check if specified, converting seconds to Duration */
    if (props.healthCheck) {
      fargateService.targetGroup.configureHealthCheck({
        ...props.healthCheck,
        interval: props.healthCheck.interval ?? Duration.seconds(props.healthCheck.intervalInSecs),
        timeout: props.healthCheck.timeout ?? Duration.seconds(props.healthCheck.timeoutInSecs),
      })
    }

    return fargateService
  }
}
