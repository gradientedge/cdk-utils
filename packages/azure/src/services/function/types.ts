import { input } from '@pulumi/azure-native/types/index.js'
import { WebAppArgs, WebAppFunctionArgs } from '@pulumi/azure-native/web/index.js'

/** @category Interface */
export interface FunctionAppProps extends WebAppArgs {
  name?: string
}

/** @category Interface */
export interface FunctionProps extends WebAppFunctionArgs {
  name: string
  functionAppId: string
  language?: string
  configJson?: any
  testData?: string
  enabled?: boolean
}

/** @category Interface */
export interface FunctionAppFlexConsumptionProps extends WebAppArgs {
  name?: string
  runtime?: input.web.FunctionsRuntimeArgs
  scaleAndConcurrency?: input.web.FunctionsScaleAndConcurrencyArgs
  storageAuthenticationType?: string
  storageContainerType?: string
}
