import * as ec2 from '@aws-cdk/aws-ec2'
import * as ecr from '@aws-cdk/aws-ecr-assets'
import * as eks from '@aws-cdk/aws-eks'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps, EksClusterProps } from './types'
import { createCfnOutput } from './genericUtils'

export class EksManager {
  public createEksDeployment(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    image: ecr.DockerImageAsset,
    vpc: ec2.IVpc
  ) {
    if (!props.eksClusters || props.eksClusters.length == 0) throw `EksCluster props undefined`

    const eksClusterProps = props.eksClusters.find((eks: EksClusterProps) => eks.id === id)
    if (!eksClusterProps) throw `Could not find eksCluster props for id:${id}`

    const appLabel = { app: `${id}`.toLowerCase() }

    const deployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: `${id}`.toLowerCase() },
      spec: {
        selector: { matchLabels: appLabel },
        template: {
          metadata: { labels: appLabel },
          spec: {
            containers: [
              {
                name: `${id}`.toLowerCase(),
                image: image.imageUri,
                ports: [{ containerPort: eksClusterProps.appContainerPort }],
              },
            ],
          },
        },
      },
    }

    const service = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: `${id}`.toLowerCase() },
      spec: {
        type: 'LoadBalancer',
        ports: [
          {
            name: 'http-port',
            protocol: 'TCP',
            port: 80,
            targetPort: eksClusterProps.appContainerPort,
          },
        ],
        selector: appLabel,
      },
    }

    const cluster = new eks.Cluster(scope, `${id}Cluster`, {
      clusterName: `${id.toLowerCase()}-${props.stage}`,
      defaultCapacity: eksClusterProps.appCapacity,
      defaultCapacityInstance: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      version: eks.KubernetesVersion.V1_18,
      vpc,
    })

    cluster.addManifest(`${id}Pod`, service, deployment)

    createCfnOutput(`${id}ClusterArn`, scope, cluster.clusterArn)
    createCfnOutput(`${id}ClusterEndpoint`, scope, cluster.clusterEndpoint)

    return cluster
  }
}
