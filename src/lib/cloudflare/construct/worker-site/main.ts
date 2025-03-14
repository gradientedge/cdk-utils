import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret'
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version'
import { DataAzurermKeyVault } from '@cdktf/provider-azurerm/lib/data-azurerm-key-vault'
import { DataAzurermKeyVaultSecret } from '@cdktf/provider-azurerm/lib/data-azurerm-key-vault-secret'
import { DataCloudflareZone } from '@cdktf/provider-cloudflare/lib/data-cloudflare-zone'
import {
  WorkerScript,
  WorkerScriptPlainTextBinding,
  WorkerScriptSecretTextBinding,
} from '@cdktf/provider-cloudflare/lib/worker-script'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { Fn, TerraformAsset, AssetType } from 'cdktf'
import { Construct } from 'constructs'
import { CommonCloudflareConstruct } from '../../common'
import { CloudflareWorkerSiteProps } from './types'
import { keyVault, resourceGroup } from '@cdktf/provider-azurerm'

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
  siteWorkerScript: WorkerScript
  workerPlainTextBindingEnvironmentVariables: WorkerScriptPlainTextBinding[]
  workerSecretTextBindingEnvironmentVariables: WorkerScriptSecretTextBinding[]

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
    this.createZoneSettingsOverride()
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
      plainTextBinding: this.workerPlainTextBindingEnvironmentVariables,
      secretTextBinding: this.workerSecretTextBindingEnvironmentVariables,
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
      hostname: `${this.props.siteSubDomain}.${this.props.domainName}`,
      service: this.siteWorkerScript.name,
    })
  }

  /**
   * @summary Resolve secrets from AWS Secrets Manager
   * @param secretName the secret name
   * @param secretKey the secret key
   * @returns the secret value
   */
  protected resolveSecretFromAWS(secretName: string, secretKey: string) {
    if (!this.awsProvider) return
    const secret = new DataAwsSecretsmanagerSecret(this, `${this.id}-${secretName}-${secretKey}`, { name: secretName })
    const secretVersion = new DataAwsSecretsmanagerSecretVersion(this, `${this.id}-${secretName}-${secretKey}-ver`, {
      provider: this.awsProvider,
      secretId: secret.id,
    })
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
  protected resolveSecretFromAzure(resourceGroupName: string, keyVaultName: string, secretKey: string) {
    if (!this.azurermProvider) return
    const keyvalu = new DataAzurermKeyVault(this, `${this.id}-${resourceGroupName}-${keyVaultName}-data`, {
      resourceGroupName: resourceGroupName,
      name: keyVaultName,
      provider: this.azurermProvider,
    })
    const secretValue = new DataAzurermKeyVaultSecret(this, `${this.id}-${resourceGroupName}-${keyVaultName}-${secretKey}-data`, {
      name: secretKey,
      keyVaultId: keyvalu.id,
      provider: this.azurermProvider,

    })
    if (!secretValue) throw new Error(`Unable to resolve secret:${secretKey}`)
    return secretValue.value
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
  protected createZoneSettingsOverride() {
    if (!this.props.siteZoneSettingsOverride) return
    this.zoneManager.createZoneSettingsOverride(
      `${this.id}-zone-settings-override`,
      this,
      this.props.siteZoneSettingsOverride
    )
  }
}
