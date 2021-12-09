import { CommonConstruct } from './commonConstruct'
import * as cdk from '@aws-cdk/core'
import * as secretsManager from '@aws-cdk/aws-secretsmanager'

const AWS = require('aws-sdk')
const fs = require('fs')

/**
 * @category Security, Identity & Compliance
 * @summary Provides operations on AWS Secrets Manager.
 * - A new instance of this class is injected into {@link CommonConstruct} constructor.
 * - If a custom construct extends {@link CommonConstruct}, an instance is available within the context.
 * @example
 * import * as common from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends common.CommonConstruct {
 *   constructor(parent: cdk.Construct, id: string, props: common.CommonStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.s3Manager.loadSecret('MySecretName', 'eu-west-1')
 * }
 *
 * @see [CDK Secrets Manager Module]{@link https://docs.aws.amazon.com/cdk/api/latest/docs/aws-secretsmanager-readme.html}</li></i>
 */
export class SecretsManager {
  /**
   *
   * @param {string} region
   */
  public getAwsSecretsManager(region: string) {
    return new AWS.SecretsManager({ region: region })
  }

  /**
   *
   * @param {string} secretName
   * @param {string} region
   */
  public async loadSecret(secretName: string, region: string) {
    const secretsManager = this.getAwsSecretsManager(region)
    const secret: any = await Promise.all([
      secretsManager.getSecretValue({ SecretId: secretName }).promise(),
    ])

    return secret ? JSON.parse(secret[0].SecretString) : {}
  }

  /**
   *
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
   *
   */
  public exportToDotEnv() {
    let nconf = require('nconf')
    nconf.argv().env()
    const appRoot = require('app-root-path')

    if (nconf.get('profile')) {
      console.log(`Using named aws profile ${nconf.get('profile')}`)
      AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: nconf.get('profile') })
    }

    const region = nconf.get('region')
    AWS.config.update({ region: nconf.get('region') })

    const outFileName = nconf.get('out') ? nconf.get('out') : '.env'

    this.loadSecret(nconf.get('name'), region).then((secretString: any) => {
      if (nconf.get('overwrite')) {
        fs.writeFileSync(`${appRoot.path}/.env`, '')
      }

      Object.keys(secretString).forEach(function (key) {
        console.log(`Adding environment variable for key: ${key}`)
        fs.appendFileSync(`${appRoot.path}/${outFileName}`, `${key}=${secretString[key]}\r\n`)
      })
    })
  }

  /**
   *
   * @param id
   * @param scope
   * @param stackName
   * @param exportName
   */
  public retrieveSecretFromSecretsManager(
    id: string,
    scope: CommonConstruct,
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
