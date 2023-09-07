import { StorageAccountConfig } from '@cdktf/provider-azurerm/lib/storage-account'
import { StorageBlobConfig } from '@cdktf/provider-azurerm/lib/storage-blob'
import { StorageContainerConfig } from '@cdktf/provider-azurerm/lib/storage-container'
import { BaseConfigProps } from '../../types'

export interface StorageAccountProps extends StorageAccountConfig {}

export interface StorageContainerProps extends BaseConfigProps, StorageContainerConfig {}

export interface StorageBlobProps extends BaseConfigProps, StorageBlobConfig {}
