import { LinuxFunctionAppConfig } from '@cdktf/provider-azurerm/lib/linux-function-app'
import { FunctionAppFunctionConfig } from '@cdktf/provider-azurerm/lib/function-app-function'
import { FunctionAppFlexConsumptionConfig } from '@cdktf/provider-azurerm/lib/function-app-flex-consumption'

export interface FunctionAppProps extends LinuxFunctionAppConfig {}

export interface FunctionProps extends FunctionAppFunctionConfig {}

export interface FunctionAppFlexConsumptionProps extends FunctionAppFlexConsumptionConfig {}
