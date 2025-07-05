import { StorageAccountConfig } from '@cdktf/provider-azurerm/lib/storage-account'
import { StorageBlobConfig } from '@cdktf/provider-azurerm/lib/storage-blob'
import { StorageContainerConfig } from '@cdktf/provider-azurerm/lib/storage-container'
import { DataAzurermStorageAccountBlobContainerSasConfig } from '@cdktf/provider-azurerm/lib/data-azurerm-storage-account-blob-container-sas'
import { BaseAzureConfigProps } from '../../types'

export interface StorageAccountProps extends StorageAccountConfig {}

export interface StorageContainerProps extends BaseAzureConfigProps, StorageContainerConfig {}

export interface StorageBlobProps extends BaseAzureConfigProps, StorageBlobConfig {}

export interface DataAzurermStorageAccountBlobContainerSasProps
  extends DataAzurermStorageAccountBlobContainerSasConfig {}
