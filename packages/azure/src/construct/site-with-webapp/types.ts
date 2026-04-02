import * as archive from '@pulumi/archive'
import { GetFileOutputArgs } from '@pulumi/archive'
import { BlobContainer, StorageAccount } from '@pulumi/azure-native/storage/index.js'
import { AppServicePlan, WebApp } from '@pulumi/azure-native/web/index.js'
import { Output } from '@pulumi/pulumi'

import { CommonAzureStackProps } from '../../common/index.js'
import { LinuxWebAppProps, ServicePlanProps, StorageAccountProps, StorageContainerProps } from '../../services/index.js'

export interface SiteProps {
  appServicePlan: ServicePlanProps
  codeArchiveFile: GetFileOutputArgs
  storageAccount: StorageAccountProps
  storageContainer: StorageContainerProps
  webApp: LinuxWebAppProps
}

export interface SiteWithWebAppProps extends CommonAzureStackProps {
  deploySource: string
  nodeOptions: string
  nodeEnv?: string
  packageName: string
  site: SiteProps
  startCommand: string
}

export interface Site {
  appServicePlan: AppServicePlan
  codeArchiveFile: Output<archive.GetFileResult>
  environmentVariables: Record<string, any>
  storageAccount: StorageAccount
  storageContainer: BlobContainer
  webApp: WebApp
}
