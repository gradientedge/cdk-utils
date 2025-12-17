import { DataAzurermStorageAccountBlobContainerSasConfig } from '@cdktf/provider-azurerm/lib/data-azurerm-storage-account-blob-container-sas/index.js'
import { StorageAccountConfig } from '@cdktf/provider-azurerm/lib/storage-account/index.js'
import { StorageBlobConfig } from '@cdktf/provider-azurerm/lib/storage-blob/index.js'
import { StorageContainerConfig } from '@cdktf/provider-azurerm/lib/storage-container/index.js'
import { BaseAzureConfigProps } from '../../types/index.js'

export interface StorageAccountProps extends StorageAccountConfig {}

export interface StorageContainerProps extends BaseAzureConfigProps, StorageContainerConfig {}

export interface StorageBlobProps extends BaseAzureConfigProps, StorageBlobConfig {}

export interface DataAzurermStorageAccountBlobContainerSasProps extends DataAzurermStorageAccountBlobContainerSasConfig {}
