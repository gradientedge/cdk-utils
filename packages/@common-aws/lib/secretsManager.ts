const AWS = require('aws-sdk')
const fs = require('fs')

export class SecretsManager {
  public getAwsSecretsManager(region: string) {
    return new AWS.SecretsManager({ region: region })
  }

  public async loadSecret(secretName: string, region: string) {
    const secretsManager = this.getAwsSecretsManager(region)
    const secret: any = await Promise.all([
      secretsManager.getSecretValue({ SecretId: secretName }).promise(),
    ])

    return secret ? JSON.parse(secret[0].SecretString) : {}
  }

  public async loadSecrets(secretNames: string, region: string) {
    let secrets = {}
    for (const secretName of secretNames.split(',')) {
      secrets = { ...secrets, ...(await this.loadSecret(secretName, region)) }
    }

    return secrets
  }

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
}
