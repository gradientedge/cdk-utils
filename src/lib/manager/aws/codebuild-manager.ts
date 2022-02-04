import * as cdk from 'aws-cdk-lib'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as common from '../../common'

/**
 * @stability stable
 * @category Developer Tools
 * @classdesc Provides operations on AWS Code Build.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import { common.CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.codeBuildManager.createImageForCloudfrontInvalidation('MyInvalidation', this, './docker ')
 *   }
 * }
 *
 * @see [CDK Codebuild Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild-readme.html}
 */
export class CodeBuildManager {
  /**
   *
   * @param id
   * @param scope
   * @param dockerfilePath
   */
  public createImageForCloudfrontInvalidation(id: string, scope: common.CommonConstruct, dockerfilePath: string) {
    return scope.ecrManager.createDockerImage(`${id}-build-image`, scope, dockerfilePath)
  }

  /**
   *
   * @param id
   * @param scope
   * @param dockerFilepath
   * @param distributionId
   * @param paths
   */
  public createProjectForCloudfrontInvalidation(
    id: string,
    scope: common.CommonConstruct,
    dockerFilepath: string,
    distributionId: string,
    paths?: string
  ) {
    const invalidationPaths = paths ?? '/*'
    return new codebuild.Project(scope, `${id}-install-deps-project`, {
      role: scope.iamManager.roleForCloudfrontInvalidation(id, scope),
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.1',
        phases: {
          build: {
            commands: [
              `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "${invalidationPaths}"`,
            ],
          },
        },
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.fromDockerRegistry(
          this.createImageForCloudfrontInvalidation(id, scope, dockerFilepath).imageUri
        ),
        computeType: codebuild.ComputeType.SMALL,
        privileged: true,
      },
      logging: {
        cloudWatch: {
          logGroup: scope.logManager.createLogGroup(`${id}-project-log-group`, scope, {
            logGroupName: 'cloudfront-invalidation',
          }),
          enabled: true,
        },
      },
      timeout: cdk.Duration.minutes(5),
    })
  }
}
