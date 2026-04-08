import { getVaultOutput, Secret, SkuFamily, SkuName, Vault } from '@pulumi/azure-native/keyvault/index.js'
import { Input, ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { KeyVaultProps, SecretProps } from './types.js'

/**
 * Provides operations on Azure Key Vault using Pulumi
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
 * @category Service
 */
export class AzureKeyVaultManager {
  /**
   * @summary Method to create a new key vault
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props key vault properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Key Vault]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/keyvault/vault/}
   */
  public createKeyVault(
    id: string,
    scope: CommonAzureConstruct,
    props: KeyVaultProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

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
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   *
   * @summary Method to create a new key vault secret
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props key vault secret properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Key Vault Secret]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/keyvault/secret/}
   */
  public createKeyVaultSecret(
    id: string,
    scope: CommonAzureConstruct,
    props: SecretProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new Secret(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to resolve an existing key vault
   * @param scope scope in which this resource is defined
   * @param vaultName the key vault name
   * @param resourceGroupName the resource group name
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public resolveKeyVault(
    scope: CommonAzureConstruct,
    vaultName: string,
    resourceGroupName: Input<string>,
    resourceOptions?: ResourceOptions
  ) {
    return getVaultOutput({ vaultName, resourceGroupName }, { parent: scope, ...resourceOptions })
  }
}
