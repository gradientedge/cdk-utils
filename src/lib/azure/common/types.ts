import { AzurermProviderConfig } from '@cdktf/provider-azurerm/lib/provider'
import { BaseProps } from '../../common'

/**
 */
export interface CommonAzureStackProps extends BaseProps, AzurermProviderConfig {
  resourceGroupName?: string
}
