import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets'
import { CommonConstruct } from '../../common'
import { createCfnOutput } from '../../utils'

/**
 * @classdesc Provides operations on AWS Elastic Container Registry.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ecrManager.createDockerImage('MyImage', this, dockerfilePath)
 *   }
 * }
 * @see [CDK ECR Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecr-readme.html}
 */
export class EcrManager {
  /**
   * @summary Method to create a docker image in ecr
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param dockerfilePath
   */
  public createDockerImage(id: string, scope: CommonConstruct, dockerfilePath: string) {
    const asset = new DockerImageAsset(scope, `${id}`, {
      directory: dockerfilePath,
    })

    createCfnOutput(`${id}-dockerImageArn`, scope, asset.imageUri)

    return asset
  }
}
