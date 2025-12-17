import { LinuxFunctionAppConfig } from '@cdktf/provider-azurerm/lib/linux-function-app/index.js'
import { FunctionAppFunctionConfig } from '@cdktf/provider-azurerm/lib/function-app-function/index.js'
import { FunctionAppFlexConsumptionConfig } from '@cdktf/provider-azurerm/lib/function-app-flex-consumption/index.js'

export interface FunctionAppProps extends LinuxFunctionAppConfig {}

export interface FunctionProps extends FunctionAppFunctionConfig {}

export interface FunctionAppFlexConsumptionProps extends FunctionAppFlexConsumptionConfig {}
