import { input } from '@pulumi/azure-native/types/index.js'
import { WebAppArgs } from '@pulumi/azure-native/web/index.js'

export interface FunctionAppProps extends WebAppArgs {
  name?: string
}

export interface FunctionProps {
  name: string
  functionAppId: string
  language?: string
  configJson?: any
  testData?: string
  enabled?: boolean
}

export interface FunctionAppFlexConsumptionProps extends WebAppArgs {
  name?: string
  runtime?: input.web.FunctionsRuntimeArgs
  runtimeName?: string
  runtimeVersion?: string
  scaleAndConcurrency?: input.web.FunctionsScaleAndConcurrencyArgs
  storageAuthenticationType?: string
  storageContainerType?: string
}
