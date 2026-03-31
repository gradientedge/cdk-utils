import {
  Blob,
  BlobContainer,
  BlobServiceProperties,
  HttpProtocol,
  Kind,
  listStorageAccountSAS,
  ManagementPolicy,
  Permissions,
  Services,
  SignedResourceTypes,
  SkuName,
  StorageAccount,
  Table,
} from '@pulumi/azure-native/storage/index.js'
import * as pulumi from '@pulumi/pulumi'
import { ResourceOptions } from '@pulumi/pulumi'
import { CommonAzureConstruct } from '../../common/index.js'
import {
  ContainerSasTokenProps,
  ManagementPolicyProps,
  StorageAccountProps,
  StorageBlobProps,
  StorageContainerProps,
  StorageTableProps,
} from './types.js'

/**
 * @classdesc Provides operations on Azure Storage using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.storageManager.createStorageAccount('MyAccount', this, props)
 *   }
 * }
 * ```
 */
export class AzureStorageManager {
  /**
   * @summary Method to create a new storage account
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props storage account properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Storage Account]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/storageaccount/}
   */
  public createStorageAccount(
    id: string,
    scope: CommonAzureConstruct,
    props: StorageAccountProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : `${props.resourceGroupName}`

    const storageAccount = new StorageAccount(
      `${id}-sa`,
      {
        ...props,
        accountName: scope.resourceNameFormatter
          .format(props.accountName?.toString(), scope.props.resourceNameOptions?.storageAccount)
          .replace(/\W/g, '')
          .toLowerCase(),
        allowBlobPublicAccess: props.allowBlobPublicAccess ?? false,
        resourceGroupName,
        sku: props.sku ?? {
          name: SkuName.Standard_LRS,
        },
        kind: props.kind ?? Kind.StorageV2,
        location: props.location ?? scope.props.location,
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )

    new BlobServiceProperties(`${id}-blob-props`, {
      ...props.blobProperties,
      accountName: scope.resourceNameFormatter
        .format(props.accountName?.toString(), scope.props.resourceNameOptions?.storageAccount)
        .replace(/\W/g, '')
        .toLowerCase(),
      resourceGroupName,
      deleteRetentionPolicy: props.blobProperties?.deleteRetentionPolicy ?? {
        enabled: true,
        days: 7,
      },
    })

    return storageAccount
  }

  /**
   * @summary Method to create a new storage container (blob container)
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props storage container properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Blob Container]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/blobcontainer/}
   */
  public createStorageContainer(
    id: string,
    scope: CommonAzureConstruct,
    props: StorageContainerProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : `${props.resourceGroupName}`

    return new BlobContainer(
      `${id}-sc`,
      {
        ...props,
        containerName: scope.resourceNameFormatter.format(
          props.containerName?.toString(),
          scope.props.resourceNameOptions?.storageContainer
        ),
        accountName: props.accountName,
        resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new storage blob
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props storage blob properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Blob]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/blob/}
   */
  public createStorageBlob(
    id: string,
    scope: CommonAzureConstruct,
    props: StorageBlobProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : `${props.resourceGroupName}`

    return new Blob(
      `${id}-sb`,
      {
        ...props,
        blobName: scope.resourceNameFormatter.format(
          props.blobName?.toString(),
          scope.props.resourceNameOptions?.storageBlob
        ),
        accountName: props.accountName,
        containerName: `${props.containerName}-${scope.props.stage}`,
        resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Generates a container-level SAS token for an existing Azure Storage container.
   *
   * @description
   * This method generates a Shared Access Signature (SAS) token for secure container access.
   * The token is generated using Pulumi's listStorageAccountSAS function.
   *
   * @param id - Unique scoped identifier for the SAS token resource
   * @param scope - Pulumi construct scope
   * @param props - SAS options:
   *   - start: Optional start date in the format 'YYYY-MM-DD'. Defaults to today's date.
   *   - expiry: Optional expiry date in the format 'YYYY-MM-DD'. Defaults to 7 days from current date.
   * @param storageAccount - The storage account resource
   *
   * @returns A Pulumi Output containing the SAS token
   *
   * @see https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/liststorageaccountsas/
   */
  public generateContainerSasToken(
    id: string,
    scope: CommonAzureConstruct,
    props: ContainerSasTokenProps,
    storageAccount: StorageAccount
  ) {
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : `${props.resourceGroupName}`

    return pulumi
      .all([storageAccount.name])
      .apply(([accountName]) => {
        return listStorageAccountSAS({
          accountName,
          resourceGroupName,
          protocols: props.httpsOnly === false ? HttpProtocol.Https_http : HttpProtocol.Https,
          sharedAccessStartTime: props.start ?? new Date().toISOString().split('T')[0],
          sharedAccessExpiryTime:
            props.expiry ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          permissions: props.permissions ?? Permissions.R,
          services: Services.B,
          resourceTypes: SignedResourceTypes.C,
        })
      })
      .apply(result => result.accountSasToken)
  }

  /**
   * @summary Method to create a new storage management policy
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props storage management policy properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Storage Management Policy]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/managementpolicy/}
   */
  public createManagementPolicy(
    id: string,
    scope: CommonAzureConstruct,
    props: ManagementPolicyProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new ManagementPolicy(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new storage table
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props storage table properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Storage Table]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/storage/table/}
   */
  public createTable(
    id: string,
    scope: CommonAzureConstruct,
    props: StorageTableProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new Table(`${id}`, props, { parent: scope, ...resourceOptions })
  }
}
