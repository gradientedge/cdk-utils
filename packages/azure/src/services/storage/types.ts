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

/** @category Interface */
export interface StorageAccountProps extends StorageAccountArgs {
  blobProperties?: BlobServicePropertiesArgs
  skipBlobServiceProperties?: boolean
}

/** @category Interface */
export interface StorageContainerProps extends BlobContainerArgs, BaseAzureConfigProps {}

/** @category Interface */
export interface StorageBlobProps extends BaseAzureConfigProps, BlobArgs {
  skipBlobNameFormatting?: boolean
}

/** @category Interface */
export interface ManagementPolicyProps extends ManagementPolicyArgs {}

/** @category Interface */
export interface StorageTableProps extends TableArgs {}

/** @category Interface */
export interface ContainerSasTokenProps extends ListStorageAccountSASArgs {
  resourceGroupName: string
  containerName?: string
  httpsOnly?: boolean
  start?: string
  expiry?: string
}
