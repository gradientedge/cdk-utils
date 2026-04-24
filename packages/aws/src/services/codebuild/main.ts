import { Duration } from 'aws-cdk-lib'
import { BuildSpec, ComputeType, LinuxBuildImage, Project } from 'aws-cdk-lib/aws-codebuild'

import { CommonConstruct } from '../../common/index.js'

/**
 * Provides operations on AWS Code Build.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.codeBuildManager.createImageForCloudfrontInvalidation('MyInvalidation', this, './docker ')
 *   }
 * }
 * @see [CDK Codebuild Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_codebuild-readme.html}
 * @category Service
 */
export class CodeBuildManager {
  /**
   * @summary Method to create a Docker image used for CloudFront cache invalidation
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param dockerfilePath the path to the Dockerfile
   */
  public createImageForCloudfrontInvalidation(id: string, scope: CommonConstruct, dockerfilePath: string) {
    return scope.ecrManager.createDockerImage(`${id}-build-image`, scope, dockerfilePath)
  }

  /**
   * @summary Method to create a CodeBuild project for invalidating a CloudFront distribution cache
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param dockerFilepath the path to the Dockerfile for the build image
   * @param distributionId the CloudFront distribution ID to invalidate
   * @param paths optional invalidation paths (defaults to /*)
   */
  public createProjectForCloudfrontInvalidation(
    id: string,
    scope: CommonConstruct,
    dockerFilepath: string,
    distributionId: string,
    paths?: string
  ) {
    const invalidationPaths = paths ?? '/*'
    return new Project(scope, `${id}-install-deps-project`, {
      buildSpec: BuildSpec.fromObject({
        phases: {
          build: {
            commands: [
              `aws cloudfront create-invalidation --distribution-id ${distributionId} --paths "${invalidationPaths}"`,
            ],
          },
        },
        version: '0.1',
      }),
      environment: {
        buildImage: LinuxBuildImage.fromDockerRegistry(
          this.createImageForCloudfrontInvalidation(id, scope, dockerFilepath).imageUri
        ),
        computeType: ComputeType.SMALL,
        privileged: true,
      },
      logging: {
        cloudWatch: {
          enabled: true,
          logGroup: scope.logManager.createLogGroup(`${id}-project-log-group`, scope, {
            logGroupName: `${id}-cloudfront-invalidation`,
          }),
        },
      },
      role: scope.iamManager.createRoleForCloudfrontInvalidation(id, scope),
      timeout: Duration.minutes(5),
    })
  }
}
