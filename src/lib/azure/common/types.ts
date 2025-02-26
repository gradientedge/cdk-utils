import { AzurermProviderConfig } from '@cdktf/provider-azurerm/lib/provider'
import { BaseProps } from '../../common'
import { AzureRemoteBackend } from './constants'
import { AzurermBackendConfig } from 'cdktf'

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
