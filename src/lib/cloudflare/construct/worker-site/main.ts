import * as aws from '@pulumi/aws'
import * as azure from '@pulumi/azure-native'
import { Ruleset, WorkersCustomDomain, WorkersScript, Zone, ZoneSetting } from '@pulumi/cloudflare'
import { WorkersScriptBinding } from '@pulumi/cloudflare/types/input.js'
import { ComponentResourceOptions } from '@pulumi/pulumi'
import * as std from '@pulumi/std'
import fs from 'fs'
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
  siteZone: Zone
  siteWorkerScript: WorkersScript
  siteWorkerDomain: WorkersCustomDomain
  siteRuleSet: Ruleset
  siteZoneSetting: ZoneSetting
  workerPlainTextBindingEnvironmentVariables: WorkersScriptBinding[] = []
  workerSecretTextBindingEnvironmentVariables: WorkersScriptBinding[] = []

  constructor(id: string, props: CloudflareWorkerSiteProps, options?: ComponentResourceOptions) {
    super(id, props)
    this.props = props
    this.options = options
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
    const workerContent = fs.readFileSync(this.props.siteWorkerAsset, 'utf-8')
    this.siteWorkerScript = this.workerManager.createWorkerScript(`${this.id}-worker-script`, this, {
      ...this.props.siteWorkerScript,
      content: workerContent,
    })
  }

  /**
   * @summary Create the worker domain
   */
  protected createWorkerDomain() {
    this.siteWorkerDomain = this.workerManager.createWorkerDomain(`${this.id}-worker-domain`, this, {
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
  protected resolveSecretFromAWS(secretName: string, secretKey: string) {
    if (this.config.require('secretsProvider') !== 'aws') return
    const secret = aws.secretsmanager.getSecretOutput({ name: secretName })
    const secretVersion = aws.secretsmanager.getSecretVersionOutput({ secretId: secret.id })
    if (!secretVersion) throw new Error(`Unable to resolve secret:${secretName}`)
    return std.jsondecodeOutput({ input: secretVersion.secretString })
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
    if (this.config.require('secretsProvider') !== 'azure') return
    const secretValueData = azure.keyvault.getSecretOutput({
      resourceGroupName,
      secretName: secretKey,
      vaultName: keyVaultName,
    })
    if (!secretValueData) throw new Error(`Unable to resolve secret:${secretKey}`)
    return secretValueData.properties?.value
  }

  /**
   * @summary Create the rules
   */
  protected createRuleset() {
    if (!this.props.siteRuleSet) return
    this.siteRuleSet = this.ruleSetManager.createRuleSet(`${this.id}-rule`, this, this.props.siteRuleSet)
  }

  /**
   * @summary Create zone settings override
   */
  protected createZoneSetting() {
    if (!this.props.siteZoneSetting) return
    this.siteZoneSetting = this.zoneManager.createZoneSetting(
      `${this.id}-zone-setting`,
      this,
      this.props.siteZoneSetting
    )
  }
}
