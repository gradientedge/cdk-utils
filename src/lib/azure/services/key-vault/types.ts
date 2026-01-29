import { VaultArgs } from '@pulumi/azure-native/keyvault/index.js'

export interface KeyVaultProps extends VaultArgs {
  name?: string
}
