import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager'
import { Fn } from 'aws-cdk-lib'
import { Secret } from 'aws-cdk-lib/aws-secretsmanager'
import { CommonConstruct } from '../../common/index.js'
import { createCfnOutput, determineCredentials } from '../../utils/index.js'
import { SecretBaseProps } from './types.js'

/**
 * @classdesc Provides operations on AWS Secrets Manager.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import { CommonConstruct } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonConstruct {
 *   constructor(parent: Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.loadSecret('MySecretName', 'eu-west-1')
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
  public createSecret(id: string, scope: CommonConstruct, props: SecretBaseProps) {
    if (!props) throw `Secret props undefined for ${id}`
    if (!props.secretName) throw `Secret name undefined for ${id}`

    const secret = new Secret(scope, `${id}`, {
      ...props,
      secretName: scope.resourceNameFormatter.format(props.secretName, scope.props.resourceNameOptions?.secret),
    })

    createCfnOutput(`${id}-secretName`, scope, secret.secretName)
    createCfnOutput(`${id}-secretArn`, scope, secret.secretArn)

    return secret
  }

  /**
   * @summary Method to retrieve a secret from secrets manager with a cloudformation export
   * @param id
   * @param scope
   * @param stackName
   * @param exportName
   */
  public retrieveSecretFromSecretsManager(id: string, scope: CommonConstruct, stackName: string, exportName: string) {
    return Secret.fromSecretNameV2(scope, `${id}`, Fn.importValue(`${stackName}-${scope.props.stage}-${exportName}`))
  }

  /**
   * @summary Method to resolve secret value from a secret using AWS SDK
   * @param region the region in which the secret is defined
   * @param secretId the secret name/ARN
   * @param secretKey the secret key to resolve the value for
   */
  public async resolveSecretValue(region: string, secretId: string, secretKey: string) {
    const client = new SecretsManagerClient({
      credentials: determineCredentials(),
      region,
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
