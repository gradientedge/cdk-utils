import { AzurermProviderConfig } from '@cdktf/provider-azurerm/lib/provider/index.js'
import { AzurermBackendConfig } from 'cdktf'
import { BaseProps } from '../../common/index.js'
import { AzureRemoteBackend } from './constants.js'

/**
 */
export interface CommonAzureStackProps extends BaseProps, AzurermProviderConfig {
  resourceGroupName?: string
  remoteBackend?: AzureRemoteBackendProps
  globalPrefix?: string
  globalSuffix?: string
  resourcePrefix?: string
  resourceSuffix?: string
  resourceNameOptions?: { [key: string]: AzureResourceNameFormatterProps }
  location?: string
  defaultTags?: { [key: string]: string }
}

export interface AzureRemoteBackendProps extends AzurermBackendConfig {
  type: AzureRemoteBackend
}

export interface AzureResourceNameFormatterProps {
  exclude?: boolean
  globalPrefix?: boolean
  globalSuffix?: boolean
  prefix?: string
  suffix?: string
}
