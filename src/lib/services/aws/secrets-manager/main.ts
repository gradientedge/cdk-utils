import { SecretsManager as SM } from '@aws-sdk/client-secrets-manager'
import * as cdk from 'aws-cdk-lib'
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager'
import * as utils from '../../../utils'
import { CommonConstruct } from '../../../common'

/**
 * @classdesc Provides operations on AWS Secrets Manager.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.secretsManager.loadSecret('MySecretName', 'eu-west-1')
 *   }
 * }
 * @see [CDK Secrets Manager Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager-readme.html}
 */
export class SecretsManager {
  /**
   *
   * @param region
   */
  public getAwsSecretsManager(region: string) {
    return new SM({ region: region })
  }

  /**
   * @summary Method to load a secret from secrets manager
   * @param secretName
   * @param region
   */
  public async loadSecret(secretName: string, region: string) {
    const secretsManager = this.getAwsSecretsManager(region)
    const secret: any = await Promise.all([secretsManager.getSecretValue({ SecretId: secretName })])
    return secret ? JSON.parse(secret[0].SecretString) : {}
  }

  /**
   * @summary Method to retrieve a secret from secrets manager with a cloudformation export
   * @param id
   * @param scope
   * @param stackName
   * @param exportName
   */
  public retrieveSecretFromSecretsManager(id: string, scope: CommonConstruct, stackName: string, exportName: string) {
    return secretsManager.Secret.fromSecretNameV2(
      scope,
      `${id}`,
      cdk.Fn.importValue(`${stackName}-${scope.props.stage}-${exportName}`)
    )
  }

  /**
   * @summary Method to create a secret
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props the secret properties
   */
  public createSecret(id: string, scope: CommonConstruct, props: secretsManager.SecretProps) {
    const secret = new secretsManager.Secret(scope, `${id}`, {
      ...props,
      secretName: `${props.secretName}-${scope.props.stage}`,
    })

    utils.createCfnOutput(`${id}-secretName`, scope, secret.secretName)
    utils.createCfnOutput(`${id}-secretArn`, scope, secret.secretArn)

    return secret
  }
}
