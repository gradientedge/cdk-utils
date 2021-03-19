import * as ecr from '@aws-cdk/aws-ecr-assets'
import { CommonConstruct } from './commonConstruct'
import { createCfnOutput } from './genericUtils'

export class EcrManager {
  public createDockerImage(id: string, scope: CommonConstruct, dockerfilePath: string) {
    const asset = new ecr.DockerImageAsset(scope, `${id}`, {
      directory: dockerfilePath,
    })

    createCfnOutput(`${id}Arn`, scope, asset.imageUri)

    return asset
  }
}
