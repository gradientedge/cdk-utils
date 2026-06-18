import {
  BlobArgs,
  BlobContainerArgs,
  BlobServicePropertiesArgs,
  GetStorageAccountOutputArgs,
  GetBlobContainerOutputArgs,
  ListStorageAccountSASArgs,
  ManagementPolicyArgs,
  StorageAccountArgs,
  TableArgs,
} from '@pulumi/azure-native/storage/index.js'

import { BaseAzureConfigProps } from '../../types/index.js'

/**
 * Properties for creating an Azure Storage account
 * @see [Pulumi Azure Native Storage Account]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/storageaccount/}
 * @category Interface
 */
export interface StorageAccountProps extends StorageAccountArgs {
  /** Blob service properties (e.g. delete retention policy) */
  blobProperties?: BlobServicePropertiesArgs
  /** When true, skips creating the default BlobServiceProperties resource */
  skipBlobServiceProperties?: boolean
}

/**
 * Properties for creating an Azure Storage blob container
 * @see [Pulumi Azure Native Blob Container]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/blobcontainer/}
 * @category Interface
 */
export interface StorageContainerProps extends BlobContainerArgs, BaseAzureConfigProps {}

/**
 * Properties for creating an Azure Storage blob
 * @see [Pulumi Azure Native Blob]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/blob/}
 * @category Interface
 */
export interface StorageBlobProps extends BaseAzureConfigProps, BlobArgs {
  /** When true, skips resource name formatting on the blob name */
  skipBlobNameFormatting?: boolean
}

/**
 * Properties for creating an Azure Storage management policy
 * @see [Pulumi Azure Native Storage Management Policy]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/managementpolicy/}
 * @category Interface
 */
export interface ManagementPolicyProps extends ManagementPolicyArgs {}

/**
 * Properties for creating an Azure Storage table
 * @see [Pulumi Azure Native Storage Table]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/table/}
 * @category Interface
 */
export interface StorageTableProps extends TableArgs {}

/**
 * Properties for generating a container-level SAS token
 * @see [Pulumi Azure Native Storage Account SAS]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/liststorageaccountsas/}
 * @category Interface
 */
export interface ContainerSasTokenProps extends ListStorageAccountSASArgs {
  /** Resource group containing the storage account */
  resourceGroupName: string
  /** Optional container name for scoping the SAS token */
  containerName?: string
  /** When false, allows both HTTP and HTTPS protocols; defaults to HTTPS only */
  httpsOnly?: boolean
  /** SAS start date in 'YYYY-MM-DD' format; defaults to today */
  start?: string
  /** SAS expiry date in 'YYYY-MM-DD' format; defaults to 7 days from now */
  expiry?: string
}

/**
 * Properties for resolving an existing Storage account
 * @see [Pulumi Azure Native Event Grid Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/getstorageaccount/}
 * @category Interface
 */
export interface ResolveStorageAccountProps extends GetStorageAccountOutputArgs {}

/**
 * Properties for resolving an existing Storage account container
 * @see [Pulumi Azure Native Event Grid Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/getstorageaccount/}
 * @category Interface
 */
export interface ResolveStorageContainerProps extends GetBlobContainerOutputArgs {}
