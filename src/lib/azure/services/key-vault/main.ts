import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { KeyVault } from '@cdktf/provider-azurerm/lib/key-vault'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { KeyVaultProps } from './types'

/**
 * @classdesc Provides operations on Azure Key Vault
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
 *     this.keyVaultManager.createKeyVault('MyKeyVault', this, props)
 *   }
 * }
 * ```
 */
export class AzureKeyVaultManager {
  /**
   * @summary Method to create a new key vault
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props key vault properties
   * @see [CDKTF Key Vault Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/keyVault.typescript.md}
   */
  public createKeyVault(id: string, scope: CommonAzureConstruct, props: KeyVaultProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-kv-rg`, {
      name: scope.props.resourceGroupName
        ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
        : `${props.resourceGroupName}`,
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const keyVault = new KeyVault(scope, `${id}-kv`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.keyVault),
      location: resourceGroup.location,
      resourceGroupName: resourceGroup.name,
      skuName: props.skuName || 'standard',
      enableRbacAuthorization: props.enableRbacAuthorization || true,
      softDeleteRetentionDays: props.softDeleteRetentionDays || 90,
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-keyVaultName`, scope, keyVault.name)
    createAzureTfOutput(`${id}-keyVaultFriendlyUniqueId`, scope, keyVault.friendlyUniqueId)
    createAzureTfOutput(`${id}-keyVaultId`, scope, keyVault.id)

    return keyVault
  }
}
