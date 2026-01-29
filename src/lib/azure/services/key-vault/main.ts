import { SkuFamily, SkuName, Vault } from '@pulumi/azure-native/keyvault/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { KeyVaultProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Key Vault using Pulumi
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
   * @see [Pulumi Azure Native Key Vault]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/keyvault/vault/}
   */
  public createKeyVault(id: string, scope: CommonAzureConstruct, props: KeyVaultProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new Vault(
      `${id}-kv`,
      {
        ...props,
        vaultName: scope.resourceNameFormatter.format(
          props.vaultName?.toString(),
          scope.props.resourceNameOptions?.keyVault
        ),
        location: props.location ?? scope.props.location,
        resourceGroupName: resourceGroupName,
        properties: {
          ...(props.properties as any),
          sku: (props.properties as any)?.sku ?? {
            family: SkuFamily.A,
            name: SkuName.Standard,
          },
          tenantId: (props.properties as any)?.tenantId ?? scope.props.tenantId ?? '',
          enableRbacAuthorization: (props.properties as any)?.enableRbacAuthorization ?? true,
          enableSoftDelete: (props.properties as any)?.enableSoftDelete ?? true,
          softDeleteRetentionInDays: (props.properties as any)?.softDeleteRetentionInDays ?? 90,
          enablePurgeProtection: (props.properties as any)?.enablePurgeProtection ?? true,
        },
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope }
    )
  }
}
