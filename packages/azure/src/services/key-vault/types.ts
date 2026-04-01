import { SecretArgs, VaultArgs } from '@pulumi/azure-native/keyvault/index.js'

export interface KeyVaultProps extends VaultArgs {}

export interface SecretProps extends SecretArgs {}
