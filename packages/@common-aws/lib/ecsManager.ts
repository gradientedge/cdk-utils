import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecs from '@aws-cdk/aws-ecs'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './commonStack'
import { createCfnOutput } from './genericUtils'

export interface EcsClusterProps extends ecs.ClusterProps {
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
}
