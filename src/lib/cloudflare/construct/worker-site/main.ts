import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version/index.js'
import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret/index.js'
import { DataAzurermKeyVaultSecret } from '@cdktf/provider-azurerm/lib/data-azurerm-key-vault-secret/index.js'
import { DataAzurermKeyVault } from '@cdktf/provider-azurerm/lib/data-azurerm-key-vault/index.js'
import { DataCloudflareZone } from '@cdktf/provider-cloudflare/lib/data-cloudflare-zone/index.js'
import { WorkersScript, WorkersScriptBindings } from '@cdktf/provider-cloudflare/lib/workers-script/index.js'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone/index.js'
import { AssetType, Fn, TerraformAsset } from 'cdktf'
import { Construct } from 'constructs'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { CloudflareWorkerSiteProps } from './types.js'

/**
 * @classdesc Provides a construct to create and deploy a cloudflare worker site
 * @example
 * import { CloudflareWorkerSite, CloudflareWorkerSiteProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends CloudflareWorkerSite {
 *   constructor(parent: Construct, id: string, props: CloudflareWorkerSiteProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class CloudflareWorkerSite extends CommonCloudflareConstruct {
  declare props: CloudflareWorkerSiteProps

  /* worker site resources */
  siteZone: DataCloudflareZone | Zone
  siteWorkerScript: WorkersScript
  workerPlainTextBindingEnvironmentVariables: WorkersScriptBindings[] = []
  workerSecretTextBindingEnvironmentVariables: WorkersScriptBindings[] = []

  constructor(parent: Construct, id: string, props: CloudflareWorkerSiteProps) {
    super(parent, id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  protected initResources() {
    this.resolveZone()
    this.resolveEnvironmentVariables()
    this.createWorker()
    this.createWorkerDomain()
    this.createRuleset()
    this.createZoneSetting()
  }

  /**
   * @summary Resolve the zone to use for the worker site
   */
  protected resolveZone() {
    if (this.props.useExistingZone) {
      this.siteZone = this.zoneManager.resolveZone(`${this.id}-zone`, this)
    } else {
      this.siteZone = this.zoneManager.createZone(`${this.id}-zone`, this, this.props.siteZone)
    }
  }

  /**
   * @summary Resolve the environment variables to use for the static site
   */
  protected resolveEnvironmentVariables() {
    this.props.siteWorkerScript = {
      ...this.props.siteWorkerScript,
      bindings: this.workerPlainTextBindingEnvironmentVariables.concat(
        this.workerSecretTextBindingEnvironmentVariables
      ),
    }
  }

  /**
   * @summary Create the worker
   */
  protected createWorker() {
    const workerContent = new TerraformAsset(this, `${this.id}-worker-content`, {
      path: this.props.siteWorkerAsset,
      type: AssetType.FILE,
    })

    this.siteWorkerScript = this.workerManager.createWorkerScript(`${this.id}-worker-script`, this, {
      ...this.props.siteWorkerScript,
      content: Fn.file(workerContent.path),
    })
  }

  /**
   * @summary Create the worker domain
   */
  protected createWorkerDomain() {
    this.workerManager.createWorkerDomain(`${this.id}-worker-domain`, this, {
      ...this.props.siteWorkerDomain,
      environment: this.props.siteWorkerDomain.environment ?? 'production',
      hostname: `${this.props.siteSubDomain}.${this.props.domainName}`,
      service: this.siteWorkerScript.scriptName,
    })
  }

  /**
   * @summary Resolve secrets from AWS Secrets Manager
   * @param secretName the secret name
   * @param secretKey the secret key
   * @returns the secret value
   */
  protected resolveSecretFromAWS(secretName: string, secretKey: string, id?: string) {
    if (!this.awsProvider) {
      throw new Error(`Unable to resolve secret:${secretKey}. AWS provider not found`)
    }
    const secret = new DataAwsSecretsmanagerSecret(this, id ?? `${this.id}-${secretName}-${secretKey}`, {
      name: secretName,
    })
    const secretVersion = new DataAwsSecretsmanagerSecretVersion(
      this,
      id ? `${id}-ver` : `${this.id}-${secretName}-${secretKey}-ver`,
      {
        provider: this.awsProvider,
        secretId: secret.id,
      }
    )
    if (!secretVersion) throw new Error(`Unable to resolve secret:${secretName}`)
    return Fn.lookup(Fn.jsondecode(secretVersion.secretString), secretKey)
  }

  /**
   * @summary Resolve secrets from Azure Key Vault
   *
   * @param resourceGroupName the resource group name where the key vault is located
   * @param keyVaultName the key vault name
   * @param secretKey the secret key
   * @returns the secret value
   */
  protected resolveSecretFromAzure(resourceGroupName: string, keyVaultName: string, secretKey: string, id?: string) {
    if (!this.azurermProvider) {
      throw new Error(`Unable to resolve secret:${secretKey}. Azurerm provider not found`)
    }
    const keyVaultData = new DataAzurermKeyVault(
      this,
      id ? `${id}-vault` : `${this.id}-${resourceGroupName}-${keyVaultName}-${secretKey}-vault`,
      {
        resourceGroupName: resourceGroupName,
        name: keyVaultName,
        provider: this.azurermProvider,
      }
    )
    const secretValueData = new DataAzurermKeyVaultSecret(
      this,
      id ? `${id}-secret` : `${this.id}-${resourceGroupName}-${keyVaultName}-${secretKey}-secret`,
      {
        name: secretKey,
        keyVaultId: keyVaultData.id,
        provider: this.azurermProvider,
      }
    )
    if (!secretValueData) throw new Error(`Unable to resolve secret:${secretKey}`)
    return secretValueData.value
  }

  /**
   * @summary Create the rules
   */
  protected createRuleset() {
    if (!this.props.siteRuleSet) return
    this.ruleSetManager.createRuleSet(`${this.id}-rule`, this, this.props.siteRuleSet)
  }

  /**
   * @summary Create zone settings override
   */
  protected createZoneSetting() {
    if (!this.props.siteZoneSetting) return
    this.zoneManager.createZoneSetting(`${this.id}-zone-setting`, this, this.props.siteZoneSetting)
  }
}
