import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { DataAzurermStorageAccount } from '@cdktf/provider-azurerm/lib/data-azurerm-storage-account'
import { DataAzurermStorageContainer } from '@cdktf/provider-azurerm/lib/data-azurerm-storage-container'
import { StorageAccount } from '@cdktf/provider-azurerm/lib/storage-account'
import { StorageBlob } from '@cdktf/provider-azurerm/lib/storage-blob'
import { StorageContainer } from '@cdktf/provider-azurerm/lib/storage-container'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { StorageAccountProps, StorageBlobProps, StorageContainerProps } from './types'

/**
 * @classdesc Provides operations on Azure Storage
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
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
   * @see [CDKTF Storage Account Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/storageAccount.typescript.md}
   */
  public createStorageAccount(id: string, scope: CommonAzureConstruct, props: StorageAccountProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-sc-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const storageAccount = new StorageAccount(scope, `${id}-sa`, {
      ...props,
      accountTier: props.accountTier ?? 'Standard',
      location: props.location ?? resourceGroup.location,
      name: `${props.name}-${scope.props.stage}`.replace(/\W/g, '').toLowerCase(),
      resourceGroupName: resourceGroup.name,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-storageAccountName`, scope, storageAccount.name)
    createAzureTfOutput(`${id}-storageAccountFriendlyUniqueId`, scope, storageAccount.friendlyUniqueId)
    createAzureTfOutput(`${id}-storageAccountId`, scope, storageAccount.id)

    return storageAccount
  }

  /**
   * @summary Method to create a new storage container
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props storage container properties
   * @see [CDKTF Storage Container Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/storageContainer.typescript.md}
   */
  public createStorageContainer(id: string, scope: CommonAzureConstruct, props: StorageContainerProps) {
    if (!props) throw `Props undefined for ${id}`

    const storageContainer = new StorageContainer(scope, `${id}-sc`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
    })

    createAzureTfOutput(`${id}-storageContainerName`, scope, storageContainer.name)
    createAzureTfOutput(`${id}-storageContainerFriendlyUniqueId`, scope, storageContainer.friendlyUniqueId)
    createAzureTfOutput(`${id}-storageContainerId`, scope, storageContainer.id)

    return storageContainer
  }

  /**
   * @summary Method to create a new storage blob
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props storage blob properties
   * @see [CDKTF Storage Blob Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/storageBlob.typescript.md}
   */
  public createStorageBlob(id: string, scope: CommonAzureConstruct, props: StorageBlobProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-sb-rg`, {
      name: scope.props.resourceGroupName
        ? `${scope.props.resourceGroupName}-${scope.props.stage}`
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const storageAccount = new DataAzurermStorageAccount(scope, `${id}-sa`, {
      name: `${props.storageAccountName}-${scope.props.stage}`,
      resourceGroupName: resourceGroup.name,
    })

    const storageContainer = new DataAzurermStorageContainer(scope, `${id}-sc`, {
      name: `${props.storageContainerName}-${scope.props.stage}`,
      storageAccountName: undefined, // the `storage_account_name` property has been deprecated in favour of `storage_account_id` and will be removed in version 5.0 of the Provider.
      storageAccountId: storageAccount.id,
    })

    const storageBlob = new StorageBlob(scope, `${id}-sb`, {
      ...props,
      name: `${props.name}-${scope.props.stage}`,
      storageAccountName: storageAccount.name,
      storageContainerName: storageContainer.name,
    })

    createAzureTfOutput(`${id}-storageBlobName`, scope, storageBlob.name)
    createAzureTfOutput(`${id}-storageBlobFriendlyUniqueId`, scope, storageBlob.friendlyUniqueId)
    createAzureTfOutput(`${id}-storageBlobId`, scope, storageBlob.id)

    return storageBlob
  }
}
