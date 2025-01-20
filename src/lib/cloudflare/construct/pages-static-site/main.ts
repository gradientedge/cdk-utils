import { DataAwsSecretsmanagerSecret } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret'
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version'
import { DataCloudflareZone } from '@cdktf/provider-cloudflare/lib/data-cloudflare-zone'
import { PagesDomain } from '@cdktf/provider-cloudflare/lib/pages-domain'
import { PagesProject } from '@cdktf/provider-cloudflare/lib/pages-project'
import { Record } from '@cdktf/provider-cloudflare/lib/record'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { Fn } from 'cdktf'
import { Construct } from 'constructs'
import { CommonCloudflareConstruct } from '../../common'
import { CloudflarePagesStaticSiteProps } from './types'

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
  sitePagesCnameRecord: Record
  sitePagesDomain: PagesDomain
  sitePagesProject: PagesProject
  siteZone: DataCloudflareZone | Zone
  sitePagesEnvironmentVariables: { [key: string]: string }
  sitePagesPreviewEnvironmentVariables: { [key: string]: string }
  sitePagesSecrets: { [key: string]: string }
  sitePagesPreviewSecrets: { [key: string]: string }
  siteDeploymentDependsOn: any

  constructor(parent: Construct, id: string, props: CloudflarePagesStaticSiteProps) {
    super(parent, id, props)
    this.props = props
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
          secrets: this.sitePagesPreviewSecrets,
        },
        production: {
          secrets: this.sitePagesSecrets,
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
          environmentVariables: this.sitePagesPreviewEnvironmentVariables,
        },
        production: {
          environmentVariables: this.sitePagesEnvironmentVariables,
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
      domain: `${this.props.siteSubDomain}.${this.props.domainName}`,
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
      value: `${this.sitePagesProject.name}.pages.dev`,
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
      projectName: this.sitePagesProject.name,
      dependsOn: this.siteDeploymentDependsOn,
    })
  }
}
