import * as ecr from '@aws-cdk/aws-ecr-assets'
import { CommonConstruct } from './commonConstruct'
import { CommonStackProps } from './types'
import { createCfnOutput } from './genericUtils'

export class EcrManager {
  public createDockerImage(
    id: string,
    scope: CommonConstruct,
    props: CommonStackProps,
    dockerfilePath: string
  ) {
    const asset = new ecr.DockerImageAsset(scope, `${id}`, {
      directory: dockerfilePath,
    })

    createCfnOutput(`${id}Arn`, scope, asset.imageUri)

    return asset
  }
}
