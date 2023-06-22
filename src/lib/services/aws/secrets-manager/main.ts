import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
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

  /**
   * @summary Method to resolve secret value from a secret using AWS SDK
   * @param scope scope in which this resource is defined
   * @param secretId the secret name/ARN
   * @param secretKey the secret key to resolve the value for
   */
  public async resolveSecretValue(scope: CommonConstruct, secretId: string, secretKey: string) {
    const client = new SecretsManagerClient({
      credentials: utils.determineCredentials(),
      region: scope.props.region,
    })
    const command = new GetSecretValueCommand({
      SecretId: secretId,
    })
    const response = await client.send(command)
    if (!response.SecretString) throw `Unable to resolve secret for ${secretId}`
    const secretString = JSON.parse(response.SecretString)

    return secretString[secretKey]
  }
}
