import * as ecr from 'aws-cdk-lib/aws-ecr-assets'
import { CommonConstruct } from '../common/commonConstruct'
import { createCfnOutput } from '../utils'

/**
 * @category Containers
 * @summary Provides operations on AWS Elastic Container Registry.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ecrManager.createDockerImage('MyImage', this, dockerfilePath)
 * }
 *
 * @see [CDK ECR Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-ecr-readme.html}</li></i>
 */
export class EcrManager {
  /**
   *
   * @param {string} id scoped id of the resource
   * @param {CommonConstruct} scope scope in which this resource is defined
   * @param {string} dockerfilePath
   */
  public createDockerImage(id: string, scope: CommonConstruct, dockerfilePath: string) {
    const asset = new ecr.DockerImageAsset(scope, `${id}`, {
      directory: dockerfilePath,
    })

    createCfnOutput(`${id}-dockerImageArn`, scope, asset.imageUri)

    return asset
  }
}
