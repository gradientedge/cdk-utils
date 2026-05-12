import { SecretArgs, VaultArgs } from '@pulumi/azure-native/keyvault/index.js'

/**
 * Properties for creating an Azure Key Vault
 * @see [Pulumi Azure Native Key Vault]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/keyvault/vault/}
 * @category Interface
 */
export interface KeyVaultProps extends VaultArgs {}

/**
 * Properties for creating an Azure Key Vault secret
 * @see [Pulumi Azure Native Key Vault Secret]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/keyvault/secret/}
 * @category Interface
 */
export interface SecretProps extends SecretArgs {}
