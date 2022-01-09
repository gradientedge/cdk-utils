import { CommonConstruct } from '../common/commonConstruct'
import * as codebuild from 'aws-cdk-lib/aws-codebuild'
import * as cdk from 'aws-cdk-lib'

/**
 *
 */
export class CodeBuildManager {
  /**
   *
   * @param id
   * @param scope
   * @param dockerfilePath
   */
  public createImageForCloudfrontInvalidation(id: string, scope: CommonConstruct, dockerfilePath: string) {
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
    scope: CommonConstruct,
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
