import { LinuxFunctionAppConfig } from '@cdktf/provider-azurerm/lib/linux-function-app'
import { FunctionAppFunctionConfig } from '@cdktf/provider-azurerm/lib/function-app-function'
import { BaseAzureConfigProps } from '../../types'

export interface FunctionAppProps extends LinuxFunctionAppConfig {}

export interface FunctionProps extends FunctionAppFunctionConfig {}
