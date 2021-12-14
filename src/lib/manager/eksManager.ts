import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as ecr from 'aws-cdk-lib/aws-ecr-assets'
import * as eks from 'aws-cdk-lib/aws-eks'
import { CommonConstruct } from '../common/commonConstruct'
import { EksClusterProps } from '../types'
import { createCfnOutput } from '../utils'

/**
 * @category Containers
 * @summary Provides operations on AWS Elastic Kubernetes Service.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.eksManager.createEksDeployment('MyEksDeployment', this, image, vpc)
 * }
 *
 * @see [CDK EKS Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-eks-readme.html}</li></i>
 */
export class EksManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {EksClusterProps} props
   * @param {ecr.DockerImageAsset} image
   * @param {ec2.IVpc} vpc
   */
  public createEksDeployment(
    id: string,
    scope: CommonConstruct,
    props: EksClusterProps,
    image: ecr.DockerImageAsset,
    vpc: ec2.IVpc
  ) {
    if (!props) throw `EksCluster props undefined`

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
                ports: [{ containerPort: props.appContainerPort }],
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
            targetPort: props.appContainerPort,
          },
        ],
        selector: appLabel,
      },
    }

    const cluster = new eks.Cluster(scope, `${id}Cluster`, {
      clusterName: `${id.toLowerCase()}-${scope.props.stage}`,
      defaultCapacity: props.appCapacity,
      defaultCapacityInstance: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      version: eks.KubernetesVersion.V1_18,
      vpc,
    })

    cluster.addManifest(`${id}Pod`, service, deployment)

    createCfnOutput(`${id}-clusterArn`, scope, cluster.clusterArn)
    createCfnOutput(`${id}-clusterEndpoint`, scope, cluster.clusterEndpoint)

    return cluster
  }
}
