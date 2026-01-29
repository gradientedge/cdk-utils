import { BaseProps } from '../../common/index.js'
import { AzureRemoteBackend } from './constants.js'

/**
 * @interface CommonAzureStackProps
 * @description Common properties for Azure stack configuration using Pulumi
 */
export interface CommonAzureStackProps extends BaseProps {
  resourceGroupName?: string
  remoteBackend?: AzureRemoteBackendProps
  globalPrefix?: string
  globalSuffix?: string
  resourcePrefix?: string
  resourceSuffix?: string
  resourceNameOptions?: { [key: string]: AzureResourceNameFormatterProps }
  location?: string
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
