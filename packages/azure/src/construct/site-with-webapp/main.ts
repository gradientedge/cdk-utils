import { writeFileSync } from 'fs'
import * as path from 'path'

import * as archive from '@pulumi/archive'
import { getComponentOutput, GetComponentResult } from '@pulumi/azure-native/applicationinsights/index.js'
import { Output, ResourceOptions } from '@pulumi/pulumi'
import _ from 'lodash'

import { CommonAzureConstruct } from '../../common/index.js'

import { Site, SiteWithWebAppProps } from './types.js'

/**
 * Provides a construct to create and deploy a site hosted with an Azure Linux Web App
 * @example
 * import { SiteWithWebApp, SiteWithWebAppProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends SiteWithWebApp {
 *   constructor(id: string, props: SiteWithWebAppProps) {
 *     super(id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class SiteWithWebApp extends CommonAzureConstruct {
  props: SiteWithWebAppProps
  applicationInsights: Output<GetComponentResult>
  site: Site = {} as Site

  constructor(id: string, props: SiteWithWebAppProps) {
    super(id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createSiteAppServicePlan()
    this.createSiteStorageAccount()
    this.createSiteStorageContainer()
    this.createCodePackage()
    this.createWebAppSiteConfig()
    this.createWebApp()
    this.createDiagnosticLog()
  }

  /**
   * @summary Method to resolve the Application Insights instance
   */
  protected resolveApplicationInsights() {
    if (!this.props.commonApplicationInsights || !this.props.commonApplicationInsights.resourceName) return

    this.applicationInsights = getComponentOutput({
      resourceName: this.props.commonApplicationInsights.resourceName,
      resourceGroupName: this.props.commonApplicationInsights.resourceGroupName,
    })
  }

  /**
   * @summary Method to create the App Service Plan for the web app
   */
  protected createSiteAppServicePlan() {
    this.site.appServicePlan = this.appServiceManager.createAppServicePlan(`${this.id}-app-service-plan`, this, {
      ...this.props.site.appServicePlan,
      name: this.id,
      kind: this.props.site.appServicePlan?.kind ?? 'linux',
      location: this.resourceGroup.location,
      resourceGroupName: this.resourceGroup.name,
    })
  }

  /**
   * @summary Method to create the storage account for the web app
   */
  protected createSiteStorageAccount() {
    this.site.storageAccount = this.storageManager.createStorageAccount(`${this.id}-storage-account`, this, {
      ...this.props.site.storageAccount,
      location: this.resourceGroup.location,
      resourceGroupName: this.resourceGroup.name,
    })
  }

  /**
   * @summary Method to create the storage container for web app deployment
   */
  protected createSiteStorageContainer() {
    this.site.storageContainer = this.storageManager.createStorageContainer(
      `${this.id}-storage-deployment-container`,
      this,
      {
        ...this.props.site.storageContainer,
        accountName: this.site.storageAccount.id,
        resourceGroupName: this.resourceGroup.name,
      }
    )
  }

  /**
   * @summary Method to create the code package archive for deployment
   */
  protected createCodePackage() {
    const currentDirectory = path.resolve()

    if (this.props.startCommand) {
      const packageJson = {
        description: 'Generated',
        name: this.id,
        private: true,
        scripts: {
          start: this.props.startCommand,
        },
        version: '1.0.0',
      }

      const packageJsonFile = `${currentDirectory}/${this.props.deploySource}/package.json`
      writeFileSync(packageJsonFile, JSON.stringify(packageJson))
    }

    this.site.codeArchiveFile = archive.getFileOutput({
      ...this.props.site.codeArchiveFile,
      excludes: this.props.site.codeArchiveFile.excludes ?? ['*.zip'],
      outputPath: `${currentDirectory}/${this.props.deploySource}/${this.props.packageName}`,
      sourceDir: `${currentDirectory}/${this.props.deploySource}`,
      type: this.props.site.codeArchiveFile.type ?? 'zip',
    })
  }

  /**
   * @summary Method to create the web app site configuration with environment variables
   */
  protected createWebAppSiteConfig() {
    this.site.environmentVariables = {
      OTEL_APPINSIGHTS_INSTRUMENTATIONKEY: this.applicationInsights.instrumentationKey,
      OTEL_APPLICATIONINSIGHTS_CONNECTION_STRING: this.applicationInsights.connectionString,
      ApplicationInsightsAgent_EXTENSION_VERSION: '~3',
      OTEL_SDK_DISABLED: 'false',
      BUILD_VERSION: '0.0.0',
      STAGE: this.props.stage,
      NODE_OPTIONS: this.props.nodeOptions,
      NODE_ENV: this.props.nodeEnv ?? 'production',
    }
  }

  /**
   * @summary Method to create the Azure Linux Web App
   */
  protected createWebApp(resourceOptions?: ResourceOptions) {
    this.site.webApp = this.appServiceManager.createLinuxWebApp(
      `${this.id}-web-app`,
      this,
      {
        ...this.props.site.webApp,
        kind: this.props.site.webApp.kind ?? 'app,linux',
        location: this.resourceGroup.location,
        resourceGroupName: this.resourceGroup.name,
        serverFarmId: this.site.appServicePlan.id,
        siteConfig: _.merge(this.props.site.webApp.siteConfig, {
          appSettings: _.map(this.site.environmentVariables, (value, name) => ({ name, value })),
        }),
      },
      { ...resourceOptions }
    )
  }

  /**
   * @summary Method to create the Monitor diagnostic log settings for the web app
   */
  protected createDiagnosticLog() {
    this.monitorManager.createMonitorDiagnosticSettings(this.id, this, {
      name: `${this.props.site.webApp.name}-webapp`,
      resourceUri: this.site.webApp.id,
      workspaceId: this.commonLogAnalyticsWorkspace.id,
      logAnalyticsDestinationType: 'Dedicated',
      logs: [
        {
          category: 'AppServiceAppLogs',
          enabled: true,
        },
        {
          category: 'AppServiceConsoleLogs',
          enabled: true,
        },
        {
          category: 'AppServiceHTTPLogs',
          enabled: true,
        },
        {
          category: 'AppServicePlatformLogs',
          enabled: true,
        },
      ],
      metrics: [
        {
          category: 'AllMetrics',
          enabled: true,
        },
      ],
    })
  }
}
