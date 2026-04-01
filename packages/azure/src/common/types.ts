import { GetComponentOutputArgs } from '@pulumi/azure-native/applicationinsights/index.js'
import { GetWorkspaceOutputArgs } from '@pulumi/azure-native/operationalinsights/index.js'
import { BaseProps } from '@gradientedge/cdk-utils-common'
import { AzureLocation, AzureRemoteBackend } from './constants.js'

export interface AzureLocationConfig {
  id: string
  name: string
}

/**
 * @interface CommonAzureStackProps
 * @description Common properties for Azure stack configuration using Pulumi
 */
export interface CommonAzureStackProps extends BaseProps {
  stackName?: string
  resourceGroupName?: string
  remoteBackend?: AzureRemoteBackendProps
  globalPrefix?: string
  globalSuffix?: string
  resourcePrefix?: string
  resourceSuffix?: string
  resourceNameOptions?: { [key: string]: AzureResourceNameFormatterProps }
  location: AzureLocation
  locationConfig?: Record<AzureLocation, AzureLocationConfig>
  locales?: string[]
  defaultTags?: { [key: string]: string }
  commonLogAnalyticsWorkspace?: GetWorkspaceOutputArgs
  commonApplicationInsights?: GetComponentOutputArgs

  // Azure Provider properties for Pulumi
  subscriptionId?: string
  tenantId?: string
  clientId?: string
  clientSecret?: string
  environment?: string
  useOidc?: boolean
  oidcRequestToken?: string
  oidcRequestUrl?: string
  useMsi?: boolean
  msiEndpoint?: string
}

export interface AzureRemoteBackendProps {
  type: AzureRemoteBackend
  storageAccountName?: string
  containerName?: string
  resourceGroupName?: string
  subscriptionId?: string
  key?: string
}

export interface AzureResourceNameFormatterProps {
  exclude?: boolean
  globalPrefix?: boolean
  globalSuffix?: boolean
  prefix?: string
  suffix?: string
}
