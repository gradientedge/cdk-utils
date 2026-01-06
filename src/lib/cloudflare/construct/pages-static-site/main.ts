import * as aws from '@pulumi/aws'
import * as azure from '@pulumi/azure-native'
import { DnsRecord, PagesDomain, PagesProject, Zone } from '@pulumi/cloudflare'
import {
  PagesProjectDeploymentConfigsPreviewEnvVars,
  PagesProjectDeploymentConfigsProductionEnvVars,
} from '@pulumi/cloudflare/types/input.js'
import { ComponentResourceOptions } from '@pulumi/pulumi'
import * as std from '@pulumi/std'
import { CommonCloudflareConstruct } from '../../common/index.js'
import { CloudflarePagesStaticSiteProps } from './types.js'

/**
 * @classdesc Provides a construct to create and deploy a cloudflare pages static site
 * @example
 * import { CloudflarePagesStaticSite, CloudflareStaticSiteProps } '@gradientedge/cdk-utils'
 * import { Construct } from 'constructs'
 *
 * class CustomConstruct extends CloudflarePagesStaticSite {
 *   constructor(parent: Construct, id: string, props: CloudflareStaticSiteProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 */
export class CloudflarePagesStaticSite extends CommonCloudflareConstruct {
  declare props: CloudflarePagesStaticSiteProps

  /* static site resources */
  sitePagesCnameRecord: DnsRecord
  sitePagesDomain: PagesDomain
  sitePagesProject: PagesProject
  siteZone: Zone
  sitePagesEnvironmentVariables: { [key: string]: PagesProjectDeploymentConfigsProductionEnvVars }
  sitePagesPreviewEnvironmentVariables: { [key: string]: PagesProjectDeploymentConfigsPreviewEnvVars }
  sitePagesSecrets: { [key: string]: PagesProjectDeploymentConfigsProductionEnvVars }
  sitePagesPreviewSecrets: { [key: string]: PagesProjectDeploymentConfigsPreviewEnvVars }
  siteDeploymentDependsOn: any

  constructor(id: string, props: CloudflarePagesStaticSiteProps, options?: ComponentResourceOptions) {
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
    this.resolveSecrets()
    this.resolveEnvironmentVariables()
    this.createProject()
    this.createDomain()
    this.createRecord()
    this.deploySite()
  }

  /**
   * @summary Resolve the zone to use for the static site
   */
  protected resolveZone() {
    if (this.props.useExistingZone) {
      this.siteZone = this.zoneManager.resolveZone(`${this.id}-zone`, this)
    } else {
      this.siteZone = this.zoneManager.createZone(`${this.id}-zone`, this, this.props.siteZone)
    }
  }

  /**
   * @summary Resolve the secrets to use for the static site
   */
  protected resolveSecrets() {
    this.props.sitePagesProject = {
      ...this.props.sitePagesProject,
      deploymentConfigs: {
        preview: {
          envVars: this.sitePagesPreviewSecrets,
        },
        production: {
          envVars: this.sitePagesSecrets,
        },
      },
    }
  }

  /**
   * @summary Resolve the environment variables to use for the static site
   */
  protected resolveEnvironmentVariables() {
    this.props.sitePagesProject = {
      ...this.props.sitePagesProject,
      deploymentConfigs: {
        preview: {
          envVars: this.sitePagesPreviewEnvironmentVariables,
        },
        production: {
          envVars: this.sitePagesEnvironmentVariables,
        },
      },
    }
  }

  /**
   * @summary Resolve secrets from AWS Secrets Manager
   * @param secretName the secret name
   * @param secretKey the secret key
   * @returns the secret value
   */
  protected async resolveSecretFromAWS(secretName: string, secretKey: string) {
    if (this.config.require('secretsProvider') !== 'aws') return
    const secret = await aws.secretsmanager.getSecret({ name: secretName })
    const secretVersion = await aws.secretsmanager.getSecretVersion({ secretId: secret.id })
    if (!secretVersion) throw new Error(`Unable to resolve secret:${secretName}`)
    return await std.jsondecode({ input: secretVersion.secretString })
  }

  /**
   * @summary Resolve secrets from Azure Key Vault
   *
   * @param resourceGroupName the resource group name where the key vault is located
   * @param keyVaultName the key vault name
   * @param secretKey the secret key
   * @returns the secret value
   */
  protected async resolveSecretFromAzure(resourceGroupName: string, keyVaultName: string, secretKey: string) {
    if (this.config.require('secretsProvider') !== 'azure') return
    const secretValueData = await azure.keyvault.getSecret({
      resourceGroupName,
      secretName: secretKey,
      vaultName: keyVaultName,
    })
    if (!secretValueData) throw new Error(`Unable to resolve secret:${secretKey}`)
    return secretValueData.properties?.value
  }

  /**
   * @summary Create the pages project
   */
  protected createProject() {
    this.sitePagesProject = this.pageManager.createPagesProject(
      `${this.id}-site-project`,
      this,
      this.props.sitePagesProject
    )
  }

  /**
   * @summary Create the pages domain
   */
  protected createDomain() {
    this.sitePagesDomain = this.pageManager.createPagesDomain(`${this.id}-site-domain`, this, {
      accountId: this.props.accountId,
      name: `${this.props.siteSubDomain}.${this.props.domainName}`,
      projectName: this.sitePagesProject.name,
    })
  }

  /**
   * @summary Create the pages cname record
   */
  protected createRecord() {
    this.sitePagesCnameRecord = this.recordManager.createRecord(`${this.id}-site-record`, this, {
      ...this.props.siteCnameRecord,
      name: this.props.siteSubDomain,
      data: {
        ...this.props.siteCnameRecord.data,
        value: `${this.sitePagesProject.name}.pages.dev`,
      },
    })
  }

  /**
   * @summary Deploy the pages project
   */
  protected deploySite() {
    this.pageManager.deployPagesProject(`${this.id}-deploy`, this, {
      branch: this.props.siteBranch ?? 'main',
      directory: this.props.siteAssetDir,
      message: this.props.siteDeployMessage,
      projectName: String(this.sitePagesProject.name),
      dependsOn: this.siteDeploymentDependsOn,
    })
  }
}
