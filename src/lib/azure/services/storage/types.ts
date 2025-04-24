import { StorageAccountConfig } from '@cdktf/provider-azurerm/lib/storage-account'
import { StorageBlobConfig } from '@cdktf/provider-azurerm/lib/storage-blob'
import { StorageContainerConfig } from '@cdktf/provider-azurerm/lib/storage-container'
import { BaseAzureConfigProps } from '../../types'

export interface StorageAccountProps extends StorageAccountConfig {}

export interface StorageContainerProps extends BaseAzureConfigProps, StorageContainerConfig {}

export interface StorageBlobProps extends BaseAzureConfigProps, StorageBlobConfig {
  /**
   * Optional ISO date string representing the expiry date for the SAS token.
   * Format: 'YYYY-MM-DD' (e.g., '2025-05-01')
   */
  sasExpiry?: string
}
