import { AzurermProviderConfig } from '@cdktf/provider-azurerm/lib/provider'
import { BaseProps } from '../../common'
import { AzureRemoteBackend } from './constants'
import { AzurermBackendConfig } from 'cdktf'

/**
 */
export interface CommonAzureStackProps extends BaseProps, AzurermProviderConfig {
  resourceGroupName?: string
  remoteBackend?: AzureRemoteBackendProps
}

export interface AzureRemoteBackendProps extends AzurermBackendConfig {
  type: AzureRemoteBackend
}
