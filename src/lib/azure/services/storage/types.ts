import {
  BlobArgs,
  BlobContainerArgs,
  ListStorageAccountSASArgs,
  StorageAccountArgs,
} from '@pulumi/azure-native/storage/index.js'
import { BaseAzureConfigProps } from '../../types/index.js'

export interface StorageAccountProps extends StorageAccountArgs {}

export interface StorageContainerProps extends BaseAzureConfigProps, BlobContainerArgs {}

export interface StorageBlobProps extends BaseAzureConfigProps, BlobArgs {}

export interface ContainerSasTokenProps extends ListStorageAccountSASArgs {
  resourceGroupName: string
  containerName?: string
  httpsOnly?: boolean
  start?: string
  expiry?: string
}
