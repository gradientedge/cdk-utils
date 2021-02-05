import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface EcsClusterProps extends ecs.ClusterProps {
  key: string
}

export interface EcsTaskProps extends ecs.TaskDefinitionProps {
  key: string
}

export class EcsManager {
  public createEcsCluster(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    vpc: ec2.IVpc
  ) {
    if (!props.ecsClusters || props.ecsClusters.length == 0) throw `Ecs Cluster props undefined`

    const ecsClusterProps = props.ecsClusters.find((ecs: EcsClusterProps) => ecs.key === key)
    if (!ecsClusterProps) throw `Could not find EcsCluster props for key:${key}`

    const ecsCluster = new ecs.Cluster(scope, `${id}`, {
      clusterName: ecsClusterProps.clusterName,
      vpc: vpc,
    })

    createCfnOutput(`${id}Arn`, scope, ecsCluster.clusterArn)
    createCfnOutput(`${id}Name`, scope, ecsCluster.clusterName)

    return ecsCluster
  }

  public createEcsFargateTask(
    id: string,
    key: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    cluster: ecs.ICluster,
    role: iam.Role,
    logGroup: logs.ILogGroup,
    containerImage: ecs.ContainerImage,
    environment?: any
  ) {
    if (!props.ecsTasks || props.ecsTasks.length == 0) throw `Ecs Task props undefined`

    const ecsTaskProps = props.ecsTasks.find((ecs: EcsTaskProps) => ecs.key === key)
    if (!ecsTaskProps) throw `Could not find EcsTask props for key:${key}`

    const ecsTask = new ecs.TaskDefinition(scope, `${id}`, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: ecsTaskProps.cpu,
      executionRole: role,
      family: props.name,
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
  }
}
