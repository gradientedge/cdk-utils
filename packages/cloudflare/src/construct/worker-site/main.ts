import fs from 'fs'
import * as path from 'path'

import * as aws from '@pulumi/aws'
import * as azure from '@pulumi/azure-native'
import {
  GetZoneResult,
  Ruleset,
  WorkersCustomDomain,
  WorkersScript,
  WorkersScriptSubdomain,
  Zone,
  ZoneSetting,
} from '@pulumi/cloudflare'
import { WorkersScriptBinding } from '@pulumi/cloudflare/types/input.js'
import { ComponentResourceOptions, Output } from '@pulumi/pulumi'
import * as std from '@pulumi/std'
import { parse, ParseError } from 'jsonc-parser'

import { CommonCloudflareConstruct } from '../../common/index.js'

import { CloudflareWorkerSiteProps } from './types.js'

/**
 * Provides a construct to create and deploy a cloudflare worker site
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
 * @category Construct
 */
export class CloudflareWorkerSite extends CommonCloudflareConstruct {
  declare props: CloudflareWorkerSiteProps

  /* worker site resources */
  /** The Cloudflare zone (created or resolved) for the worker site */
  siteZone: Zone | Output<GetZoneResult>
  /** The Cloudflare Workers script resource */
  siteWorkerScript: WorkersScript
  /** The Cloudflare Workers custom domain resource */
  siteWorkerDomain: WorkersCustomDomain
  /** Optional workers.dev subdomain configuration for the script */
  siteWorkerSubdomain: WorkersScriptSubdomain
  /** The Cloudflare ruleset resource for the worker site */
  siteRuleSet: Ruleset
  /** The Cloudflare zone setting resource for the worker site */
  siteZoneSetting: ZoneSetting
  /** Plain text binding environment variables for the worker script */
  workerPlainTextBindingEnvironmentVariables: WorkersScriptBinding[] = []
  /** Secret text binding environment variables for the worker script */
  workerSecretTextBindingEnvironmentVariables: WorkersScriptBinding[] = []

  /**
   * @summary Create a new CloudflareWorkerSite
   * @param id scoped id of the resource
   * @param props the worker site properties
   * @param options optional Pulumi component resource options
   */
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
    if (this.props.siteWranglerConfig || this.props.siteSource) this.translateWorkersBaseConfig()
    this.resolveWorkerAssetPath()
    this.resolveZone()
    this.createWorkerPlainTextBindingEnvironmentVariables()
    this.createWorkerSecretTextBindingEnvironmentVariables()
    this.resolveEnvironmentVariables()
    this.createWorker()
    this.createWorkerDomain()
    this.createWorkerSubdomain()
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
    /* merge plain text and secret text bindings into the worker script configuration */
    this.props.siteWorkerScript = {
      ...this.props.siteWorkerScript,
      bindings: this.workerPlainTextBindingEnvironmentVariables.concat(
        this.workerSecretTextBindingEnvironmentVariables
      ),
    }
  }

  protected resolveWorkerAssetPath() {
    const cdkParentDir = path.resolve(process.cwd(), '..')
    const fromCwd = path.resolve(cdkParentDir, this.props.siteWorkerAsset)
    const fromDist = path.resolve(cdkParentDir, '..', this.props.siteWorkerAsset)
    const workerAsset = [fromCwd, fromDist].find(candidate => fs.existsSync(candidate)) ?? fromCwd
    this.props.siteWorkerAsset = path.relative(cdkParentDir, workerAsset)
  }

  protected translateWorkersBaseConfig() {
    const configSource = this.props.siteWranglerConfig ?? this.props.siteSource
    if (!configSource) throw new Error('Worker Wrangler config path is required')
    const configRelPath = configSource.replace(/^\.\.\//, '')
    const fromCwd = path.resolve(process.cwd(), '..', configRelPath, 'wrangler.jsonc')
    const fromDist = path.resolve(process.cwd(), '..', '..', configRelPath, 'wrangler.jsonc')
    const configPath = fs.existsSync(fromCwd) ? fromCwd : fromDist
    const configText = fs.readFileSync(configPath, 'utf8')
    const parseErrors: ParseError[] = []
    const wranglerConfig = parse(configText, parseErrors) as {
      name?: string
      main?: string
      compatibility_date?: string
      compatibility_flags?: string[]
      cache?: { enabled?: boolean }
      observability?: {
        enabled?: boolean
        logs?: { enabled?: boolean; invocation_logs?: boolean; head_sampling_rate?: number }
        traces?: { enabled?: boolean; head_sampling_rate?: number }
      }
      assets?: { directory?: string; binding?: string; not_found_handling?: string }
      vars?: Record<string, string>
    }

    if (parseErrors.length > 0) {
      throw new Error(`Failed to parse Wrangler base config at ${configPath}`)
    }

    this.workerPlainTextBindingEnvironmentVariables = [
      ...Object.entries(wranglerConfig.vars ?? {}).map(([name, text]) => ({ name, text, type: 'plain_text' })),
      ...(wranglerConfig.assets?.binding ? [{ name: wranglerConfig.assets.binding, type: 'assets' }] : []),
    ]
    this.props.siteWorkerScript = {
      ...this.props.siteWorkerScript,
      scriptName: this.props.siteWorkerScript.scriptName ?? wranglerConfig.name,
      mainModule: wranglerConfig.main ?? this.props.siteWorkerScript?.mainModule,
      compatibilityDate: wranglerConfig.compatibility_date ?? this.props.siteWorkerScript?.compatibilityDate,
      compatibilityFlags: wranglerConfig.compatibility_flags ?? this.props.siteWorkerScript?.compatibilityFlags,
      cacheOptions: wranglerConfig.cache
        ? { enabled: wranglerConfig.cache.enabled }
        : this.props.siteWorkerScript?.cacheOptions,
      observability: wranglerConfig.observability
        ? {
            enabled: wranglerConfig.observability.enabled ?? false,
            logs: wranglerConfig.observability.logs
              ? {
                  enabled: wranglerConfig.observability.logs.enabled ?? wranglerConfig.observability.enabled ?? false,
                  invocationLogs: wranglerConfig.observability.logs.invocation_logs ?? true,
                  headSamplingRate: wranglerConfig.observability.logs.head_sampling_rate,
                }
              : undefined,
            traces: wranglerConfig.observability.traces
              ? {
                  enabled: wranglerConfig.observability.traces.enabled,
                  headSamplingRate: wranglerConfig.observability.traces.head_sampling_rate,
                }
              : undefined,
          }
        : this.props.siteWorkerScript?.observability,
      assets: wranglerConfig.assets
        ? {
            directory: wranglerConfig.assets.directory
              ? path.resolve(path.dirname(configPath), wranglerConfig.assets.directory)
              : undefined,
            config: {
              notFoundHandling: wranglerConfig.assets.not_found_handling,
            },
          }
        : this.props.siteWorkerScript?.assets,
    }
  }

  /**
   * @summary Create the plain text binding environment variables for the static site
   */
  protected createWorkerPlainTextBindingEnvironmentVariables() {}

  /**
   * @summary Create the secret text binding environment variables for the static site
   */
  protected createWorkerSecretTextBindingEnvironmentVariables() {}

  /**
   * @summary Create the worker
   */
  protected createWorker() {
    /* resolve the worker script content from the parent directory relative to the current working directory */
    const currentDirectory = path.resolve(process.cwd(), '..')
    const workerContent = fs.readFileSync(`${currentDirectory}/${this.props.siteWorkerAsset}`, 'utf-8')
    this.siteWorkerScript = this.workerManager.createWorkerScript(`${this.id}-worker-script`, this, {
      ...this.props.siteWorkerScript,
      content: workerContent,
    })
  }

  /**
   * @summary Create the worker domain
   */
  protected createWorkerDomain() {
    this.siteWorkerDomain = this.workerManager.createWorkerDomain(
      `${this.id}-worker-domain`,
      this,
      {
        ...this.props.siteWorkerDomain,
        environment: this.props.siteWorkerDomain.environment ?? 'production',
        hostname: `${this.props.siteSubDomain}.${this.props.domainName}`,
        service: this.siteWorkerScript.scriptName,
      },
      { dependsOn: [this.siteWorkerScript] }
    )
  }

  protected createWorkerSubdomain() {
    if (!this.props.siteWorkerSubdomain) return
    this.siteWorkerSubdomain = new WorkersScriptSubdomain(
      `${this.id}-worker-subdomain`,
      {
        ...this.props.siteWorkerSubdomain,
        accountId: this.props.accountId,
        scriptName: this.siteWorkerScript.scriptName,
      },
      { parent: this, dependsOn: [this.siteWorkerScript] }
    )
  }

  /**
   * @summary Resolve secrets from AWS Secrets Manager
   * @param secretName the secret name
   * @returns the secret value
   */
  protected resolveSecretFromAWS(secretName: string) {
    if (this.config.require('secretsProvider') !== 'aws') return
    /* v8 ignore start - requires real Pulumi backend for AWS invoke */
    const secret = aws.secretsmanager.getSecretOutput({ name: secretName })
    const secretVersion = aws.secretsmanager.getSecretVersionOutput({ secretId: secret.id })
    if (!secretVersion) throw new Error(`Unable to resolve secret:${secretName}`)
    return std.jsondecodeOutput({ input: secretVersion.secretString })
    /* v8 ignore stop */
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
    /* v8 ignore start - requires real Pulumi backend for Azure invoke */
    const secretValueData = azure.keyvault.getSecretOutput({
      resourceGroupName,
      secretName: secretKey,
      vaultName: keyVaultName,
    })
    if (!secretValueData) throw new Error(`Unable to resolve secret:${secretKey}`)
    return secretValueData.properties?.value
    /* v8 ignore stop */
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
