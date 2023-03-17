import { SecretsManager as SM } from '@aws-sdk/client-secrets-manager'
import * as cdk from 'aws-cdk-lib'
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager'
import * as common from '../../common'

/**
 * @stability experimental
 * @category cdk-utils.secrets-manager
 * @subcategory Construct
 * @classdesc Provides operations on AWS Secrets Manager.
 * - A new instance of this class is injected into {@link common.CommonConstruct} constructor.
 * - If a custom construct extends {@link common.CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.secretsManager.loadSecret('MySecretName', 'eu-west-1')
 *   }
 * }
 *
 * @see [CDK Secrets Manager Module]{@link https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager-readme.html}
 */
export class SecretsManager {
  /**
   *
   * @param {string} region
   */
  public getAwsSecretsManager(region: string) {
    return new SM({ region: region })
  }

  /**
   * @stability experimental
   * @summary Method to load a secret from secrets manager
   * @param {string} secretName
   * @param {string} region
   */
  public async loadSecret(secretName: string, region: string) {
    const secretsManager = this.getAwsSecretsManager(region)
    const secret: any = await Promise.all([secretsManager.getSecretValue({ SecretId: secretName })])

    return secret ? JSON.parse(secret[0].SecretString) : {}
  }

  /**
   * @stability experimental
   * @summary Method to load secrets from secrets manager
   * @param {string} secretNames
   * @param {string} region
   */
  public async loadSecrets(secretNames: string, region: string) {
    let secrets = {}
    for (const secretName of secretNames.split(',')) {
      secrets = { ...secrets, ...(await this.loadSecret(secretName, region)) }
    }

    return secrets
  }

  /**
   * @stability stable
   * @summary Method to retrieve a secret from secrets manager with a cloudformation export
   * @param id
   * @param scope
   * @param stackName
   * @param exportName
   */
  public retrieveSecretFromSecretsManager(
    id: string,
    scope: common.CommonConstruct,
    stackName: string,
    exportName: string
  ) {
    return secretsManager.Secret.fromSecretNameV2(
      scope,
      `${id}`,
      cdk.Fn.importValue(`${stackName}-${scope.props.stage}-${exportName}`)
    )
  }
}
