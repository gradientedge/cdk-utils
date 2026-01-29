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
  runtimeName?: string
  runtimeVersion?: string
  storageAuthenticationType?: string
  storageContainerType?: string
  maximumInstanceCount?: number
  instanceMemoryInMb?: number
}
