import { BaseProps } from '../../common/index.js'
import { WorkspaceProps } from '../services/index.js'
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
  commonLogAnalyticsWorkspace?: WorkspaceProps
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
