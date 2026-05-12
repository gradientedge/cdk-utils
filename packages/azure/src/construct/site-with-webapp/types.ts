import * as archive from '@pulumi/archive'
import { GetFileOutputArgs } from '@pulumi/archive'
import { BlobContainer, StorageAccount } from '@pulumi/azure-native/storage/index.js'
import { AppServicePlan, WebApp } from '@pulumi/azure-native/web/index.js'
import { Output } from '@pulumi/pulumi'

import { CommonAzureStackProps } from '../../common/index.js'
import { LinuxWebAppProps, ServicePlanProps, StorageAccountProps, StorageContainerProps } from '../../services/index.js'

/**
 * Properties for configuring the site infrastructure resources
 * @category Interface
 */
export interface SiteProps {
  /** App Service Plan properties for the web app */
  appServicePlan: ServicePlanProps
  /** Archive file configuration for code packaging */
  codeArchiveFile: GetFileOutputArgs
  /** Storage account properties for deployment artifacts */
  storageAccount: StorageAccountProps
  /** Storage container properties for deployment artifacts */
  storageContainer: StorageContainerProps
  /** Linux Web App properties */
  webApp: LinuxWebAppProps
}

/**
 * Properties for the {@link SiteWithWebApp} construct
 * @category Interface
 */
export interface SiteWithWebAppProps extends CommonAzureStackProps {
  /** Relative path to the deployment source directory */
  deploySource: string
  /** Node.js CLI options (e.g. '--max-old-space-size=4096') */
  nodeOptions?: string
  /** Node.js environment (defaults to 'production') */
  nodeEnv?: string
  /** Name of the deployment package archive file */
  packageName: string
  /** Site infrastructure resource properties */
  site: SiteProps
  /** Start command for the web app (written to generated package.json) */
  startCommand: string
}

/**
 * Provisioned site resources for the web app construct
 * @category Interface
 */
export interface Site {
  /** The provisioned App Service Plan */
  appServicePlan: AppServicePlan
  /** The archive file output for the deployment package */
  codeArchiveFile: Output<archive.GetFileResult>
  /** Environment variables configured on the web app */
  environmentVariables: Record<string, any>
  /** The provisioned storage account for deployment artifacts */
  storageAccount: StorageAccount
  /** The provisioned storage container for deployment artifacts */
  storageContainer: BlobContainer
  /** The provisioned Azure Linux Web App */
  webApp: WebApp
}
