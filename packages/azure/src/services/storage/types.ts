import {
  BlobArgs,
  BlobContainerArgs,
  BlobServicePropertiesArgs,
  ListStorageAccountSASArgs,
  ManagementPolicyArgs,
  StorageAccountArgs,
  TableArgs,
} from '@pulumi/azure-native/storage/index.js'

import { BaseAzureConfigProps } from '../../types/index.js'

export interface StorageAccountProps extends StorageAccountArgs {
  blobProperties?: BlobServicePropertiesArgs
}

export interface StorageContainerProps extends BlobContainerArgs, BaseAzureConfigProps {}

export interface StorageBlobProps extends BaseAzureConfigProps, BlobArgs {}

export interface ManagementPolicyProps extends ManagementPolicyArgs {}

export interface StorageTableProps extends TableArgs {}

export interface ContainerSasTokenProps extends ListStorageAccountSASArgs {
  resourceGroupName: string
  containerName?: string
  httpsOnly?: boolean
  start?: string
  expiry?: string
}
