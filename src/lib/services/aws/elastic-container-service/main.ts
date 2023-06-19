import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'
import { EcsApplicationLoadBalancedFargateServiceProps, EcsClusterProps, EcsTaskProps } from './types'

/**
 * @classdesc Provides operations on AWS Elastic Container Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ecsManager.createEcsCluster('MyCluster', this, vpc)
 *   }
 * }
 * @see [CDK ECS Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecs-readme.html}
 */
export class EcsManager {
  /**
   * @summary Method to create an ecs cluster
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param vpc
   */
  public createEcsCluster(id: string, scope: CommonConstruct, props: EcsClusterProps, vpc: ec2.IVpc) {
    if (!props) throw `Ecs Cluster props undefined for ${id}`

    const ecsCluster = new ecs.Cluster(scope, `${id}`, {
      capacity: props.capacity,
      clusterName: `${props.clusterName}-${scope.props.stage}`,
      containerInsights: props.containerInsights,
      defaultCloudMapNamespace: props.defaultCloudMapNamespace,
      enableFargateCapacityProviders: props.enableFargateCapacityProviders,
      executeCommandConfiguration: props.executeCommandConfiguration,
      vpc: vpc,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(ecsCluster).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-clusterArn`, scope, ecsCluster.clusterArn)
    utils.createCfnOutput(`${id}-clusterName`, scope, ecsCluster.clusterName)

    return ecsCluster
  }

  /**
   * @summary Method to create an ecs fargate task
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param cluster
   * @param role
   * @param logGroup
   * @param containerImage
   * @param environment
   * @param secrets
   * @param command
   */
  public createEcsFargateTask(
    id: string,
    scope: CommonConstruct,
    props: EcsTaskProps,
    cluster: ecs.ICluster,
    role: iam.Role,
    logGroup: logs.ILogGroup,
    containerImage: ecs.ContainerImage,
    environment?: any,
    secrets?: any,
    command?: string[]
  ) {
    if (!props) throw `EcsTask props undefined for ${id}`

    const ecsTask = new ecs.TaskDefinition(scope, `${id}`, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: props.cpu,
      ephemeralStorageGiB: props.ephemeralStorageGiB,
      executionRole: role,
      family: `${props.family}-${scope.props.stage}`,
      inferenceAccelerators: props.inferenceAccelerators,
      ipcMode: props.ipcMode,
      memoryMiB: props.memoryMiB,
      networkMode: ecs.NetworkMode.AWS_VPC,
      pidMode: props.pidMode,
      placementConstraints: props.placementConstraints,
      proxyConfiguration: props.proxyConfiguration,
      runtimePlatform: {
        cpuArchitecture: props.runtimePlatform?.cpuArchitecture ?? ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: props.runtimePlatform?.operatingSystemFamily ?? ecs.OperatingSystemFamily.LINUX,
      },
      taskRole: role,
      volumes: props.volumes,
    })

    ecsTask.addContainer('EcsContainer', {
      command: command,
      cpu: props.cpu ? parseInt(props.cpu) : undefined,
      disableNetworking: false,
      environment: environment,
      image: containerImage,
      logging: ecs.LogDriver.awsLogs({
        logGroup: logGroup,
        logRetention: props.logging?.logRetention,
        multilinePattern: props.logging?.multilinePattern,
        streamPrefix: `${id}`,
      }),
      memoryLimitMiB: props.memoryMiB ? parseInt(props.memoryMiB) : undefined,
      privileged: false,
      secrets: secrets,
    })

    if (props.tags && props.tags.length > 0) {
      props.tags.forEach(tag => {
        cdk.Tags.of(ecsTask).add(tag.key, tag.value)
      })
    }

    utils.createCfnOutput(`${id}-taskArn`, scope, ecsTask.taskDefinitionArn)

    return ecsTask
  }

  /**
   * @summary Method to create an application loadbalanced ecs fargate task
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props
   * @param cluster
   * @param logGroup
   */
  public createLoadBalancedFargateService(
    id: string,
    scope: CommonConstruct,
    props: EcsApplicationLoadBalancedFargateServiceProps,
    cluster: ecs.ICluster,
    logGroup: logs.ILogGroup
  ) {
    if (!props) throw `EcsLoadbalanced Fargate Serivice props undefined for ${id}`
    if (!props.taskImageOptions) throw `TaskImageOptions for EcsLoadbalanced Fargate Serivice props undefined for ${id}`

    const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(scope, `${id}-ecs-service`, {
      assignPublicIp: props.assignPublicIp ?? true,
      certificate: props.certificate,
      cluster: cluster,
      cpu: props.cpu,
      desiredCount: props.desiredCount,
      domainName: props.domainName,
      domainZone: props.domainZone,
      enableECSManagedTags: true,
      healthCheckGracePeriod: props.healthCheckGracePeriod ?? cdk.Duration.seconds(60),
      listenerPort: props.listenerPort,
      loadBalancerName: `${id}-${scope.props.stage}`,
      memoryLimitMiB: props.memoryLimitMiB,
      runtimePlatform: {
        cpuArchitecture: props.runtimePlatform?.cpuArchitecture ?? ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: props.runtimePlatform?.operatingSystemFamily ?? ecs.OperatingSystemFamily.LINUX,
      },
      serviceName: `${id}-${scope.props.stage}`,
      taskImageOptions: {
        containerPort: props.taskImageOptions?.containerPort,
        enableLogging: props.taskImageOptions?.enableLogging ?? true,
        environment: props.taskImageOptions?.environment,
        executionRole: props.taskImageOptions?.executionRole,
        image: props.taskImageOptions.image,
        logDriver:
          props.taskImageOptions?.logDriver ??
          ecs.LogDriver.awsLogs({
            logGroup: logGroup,
            logRetention: props.logging?.logRetention,
            multilinePattern: props.logging?.multilinePattern,
            streamPrefix: `${id}-${scope.props.stage}/ecs`,
          }),
        secrets: props.taskImageOptions?.secrets,
        taskRole: props.taskImageOptions?.taskRole,
      },
    })

    if (props.healthCheck) {
      fargateService.targetGroup.configureHealthCheck({
        enabled: props.healthCheck.enabled ?? true,
        healthyGrpcCodes: props.healthCheck.healthyGrpcCodes,
        healthyHttpCodes: props.healthCheck.healthyHttpCodes,
        healthyThresholdCount: props.healthCheck.healthyThresholdCount,
        interval: props.healthCheck.interval ?? cdk.Duration.seconds(props.healthCheck.intervalInSecs),
        path: props.healthCheck.path ?? '/',
        port: props.healthCheck.port,
        protocol: props.healthCheck.protocol,
        timeout: props.healthCheck.timeout ?? cdk.Duration.seconds(props.healthCheck.timeoutInSecs),
        unhealthyThresholdCount: props.healthCheck.unhealthyThresholdCount,
      })
    }

    return fargateService
  }
}
