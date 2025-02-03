import { FunctionAppConfig } from '@cdktf/provider-azurerm/lib/function-app'
import { FunctionAppFunctionConfig } from '@cdktf/provider-azurerm/lib/function-app-function'
import { BaseAzureConfigProps } from '../../types'

export interface FunctionAppProps extends FunctionAppConfig {}

export interface FunctionProps extends BaseAzureConfigProps, FunctionAppFunctionConfig {
  functionAppName: string
}
