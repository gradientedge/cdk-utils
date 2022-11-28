import * as cdk from 'aws-cdk-lib'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecs from 'aws-cdk-lib/aws-ecs'
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as logs from 'aws-cdk-lib/aws-logs'
import * as common from '../../common'
import * as types from '../../types'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category cdk-utils.ecs-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Elastic Container Service.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
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
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.EcsClusterProps} props
   * @param {ec2.IVpc} vpc
   */
  public createEcsCluster(id: string, scope: common.CommonConstruct, props: types.EcsClusterProps, vpc: ec2.IVpc) {
    if (!props) throw `Ecs Cluster props undefined`

    const ecsCluster = new ecs.Cluster(scope, `${id}`, {
      clusterName: `${props.clusterName}-${scope.props.stage}`,
      vpc: vpc,
      defaultCloudMapNamespace: props.defaultCloudMapNamespace,
      capacity: props.capacity,
      enableFargateCapacityProviders: props.enableFargateCapacityProviders,
      containerInsights: props.containerInsights,
      executeCommandConfiguration: props.executeCommandConfiguration,
    })

    utils.createCfnOutput(`${id}-clusterArn`, scope, ecsCluster.clusterArn)
    utils.createCfnOutput(`${id}-clusterName`, scope, ecsCluster.clusterName)

    return ecsCluster
  }

  /**
   * @summary Method to create an ecs fargate task
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.EcsTaskProps} props
   * @param {ecs.ICluster} cluster
   * @param {iam.Role} role
   * @param {logs.ILogGroup} logGroup
   * @param {ecs.ContainerImage} containerImage
   * @param {Map<string, string>} environment
   * @param {Map<string, string>} secrets
   */
  public createEcsFargateTask(
    id: string,
    scope: common.CommonConstruct,
    props: types.EcsTaskProps,
    cluster: ecs.ICluster,
    role: iam.Role,
    logGroup: logs.ILogGroup,
    containerImage: ecs.ContainerImage,
    environment?: any,
    secrets?: any
  ) {
    if (!props) throw `EcsTask props undefined`

    const ecsTask = new ecs.TaskDefinition(scope, `${id}`, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: props.cpu,
      ephemeralStorageGiB: props.ephemeralStorageGiB,
      executionRole: role,
      family: `${props.family}-${scope.props.stage}`,
      ipcMode: props.ipcMode,
      inferenceAccelerators: props.inferenceAccelerators,
      memoryMiB: props.memoryMiB,
      networkMode: ecs.NetworkMode.AWS_VPC,
      pidMode: props.pidMode,
      placementConstraints: props.placementConstraints,
      proxyConfiguration: props.proxyConfiguration,
      runtimePlatform: {
        operatingSystemFamily: props.runtimePlatform?.operatingSystemFamily ?? ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: props.runtimePlatform?.cpuArchitecture ?? ecs.CpuArchitecture.X86_64,
      },
      taskRole: role,
      volumes: props.volumes,
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
      secrets: secrets,
    })

    utils.createCfnOutput(`${id}-taskArn`, scope, ecsTask.taskDefinitionArn)

    return ecsTask
  }

  /**
   * @summary Method to create an application loadbalanced ecs fargate task
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {types.EcsApplicationLoadBalancedFargateServiceProps} props
   * @param {ecs.ICluster} cluster
   * @param {logs.ILogGroup} logGroup
   */
  public createLoadBalancedFargateService(
    id: string,
    scope: common.CommonConstruct,
    props: types.EcsApplicationLoadBalancedFargateServiceProps,
    cluster: ecs.ICluster,
    logGroup: logs.ILogGroup
  ) {
    if (!props) throw `EcsLoadbalanced Fargate Serivice props undefined`
    if (!props.taskImageOptions) throw `TaskImageOptions for EcsLoadbalanced Fargate Serivice props undefined`

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
        operatingSystemFamily: props.runtimePlatform?.operatingSystemFamily ?? ecs.OperatingSystemFamily.LINUX,
        cpuArchitecture: props.runtimePlatform?.cpuArchitecture ?? ecs.CpuArchitecture.X86_64,
      },
      serviceName: `${id}-${scope.props.stage}`,
      taskImageOptions: {
        enableLogging: props.taskImageOptions?.enableLogging ?? true,
        logDriver:
          props.taskImageOptions?.logDriver ??
          ecs.LogDriver.awsLogs({
            logGroup: logGroup,
            streamPrefix: `${id}-${scope.props.stage}/ecs`,
          }),
        image: props.taskImageOptions.image,
        executionRole: props.taskImageOptions?.executionRole,
        taskRole: props.taskImageOptions?.taskRole,
        containerPort: props.taskImageOptions?.containerPort,
        environment: props.taskImageOptions?.environment,
        secrets: props.taskImageOptions?.secrets,
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
