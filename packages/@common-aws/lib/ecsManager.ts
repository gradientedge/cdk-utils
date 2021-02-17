import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import * as iam from '@aws-cdk/aws-iam'
import * as logs from '@aws-cdk/aws-logs'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface EcsClusterProps extends ecs.ClusterProps {
  id: string
}

export interface EcsTaskProps extends ecs.TaskDefinitionProps {
  id: string
}

export class EcsManager {
  public createEcsCluster(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    vpc: ec2.IVpc
  ) {
    if (!props.ecsClusters || props.ecsClusters.length == 0) throw `Ecs Cluster props undefined`

    const ecsClusterProps = props.ecsClusters.find((ecs: EcsClusterProps) => ecs.id === id)
    if (!ecsClusterProps) throw `Could not find EcsCluster props for id:${id}`

    const ecsCluster = new ecs.Cluster(scope, `${id}`, {
      clusterName: `${ecsClusterProps.clusterName}-${props.stage}`,
      vpc: vpc,
    })

    createCfnOutput(`${id}Arn`, scope, ecsCluster.clusterArn)
    createCfnOutput(`${id}Name`, scope, ecsCluster.clusterName)

    return ecsCluster
  }

  public createEcsFargateTask(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    cluster: ecs.ICluster,
    role: iam.Role,
    logGroup: logs.ILogGroup,
    containerImage: ecs.ContainerImage,
    environment?: any
  ) {
    if (!props.ecsTasks || props.ecsTasks.length == 0) throw `Ecs Task props undefined`

    const ecsTaskProps = props.ecsTasks.find((ecs: EcsTaskProps) => ecs.id === id)
    if (!ecsTaskProps) throw `Could not find EcsTask props for id:${id}`

    const ecsTask = new ecs.TaskDefinition(scope, `${id}`, {
      compatibility: ecs.Compatibility.FARGATE,
      cpu: ecsTaskProps.cpu,
      executionRole: role,
      family: `${ecsTaskProps.family}-${props.stage}`,
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
