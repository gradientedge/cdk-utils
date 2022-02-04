import * as ecr from 'aws-cdk-lib/aws-ecr-assets'
import * as common from '../../common'
import * as utils from '../../utils'

/**
 * @stability stable
 * @category Containers
 * @classdesc Provides operations on AWS Elastic Container Registry.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.ecrManager.createDockerImage('MyImage', this, dockerfilePath)
 *   }
 * }
 *
 * @see [CDK ECR Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ecr-readme.html}
 */
export class EcrManager {
  /**
   * @summary Method to create a docker image in ecr
   * @param {string} id scoped id of the resource
   * @param {common.CommonConstruct} scope scope in which this resource is defined
   * @param {string} dockerfilePath
   */
  public createDockerImage(id: string, scope: common.CommonConstruct, dockerfilePath: string) {
    const asset = new ecr.DockerImageAsset(scope, `${id}`, {
      directory: dockerfilePath,
    })

    utils.createCfnOutput(`${id}-dockerImageArn`, scope, asset.imageUri)

    return asset
  }
}
