import { LinuxFunctionAppConfig } from '@cdktf/provider-azurerm/lib/linux-function-app'
import { FunctionAppFunctionConfig } from '@cdktf/provider-azurerm/lib/function-app-function'
import { ResourceConfig } from '../../.gen/providers/azapi/resource'

export interface FunctionAppProps extends LinuxFunctionAppConfig {}

export interface FunctionProps extends FunctionAppFunctionConfig {}

export interface FunctionAppFlexConsumptionProps {
  alwaysReady?: any
  appServicePlanId: string
  appSettings: any
  blobEndpoint: string
  connectionStrings: any
  containerName: string
  deploymentAuthenticationType?: string
  deploymentStorageType?: string
  deploySource: string
  httpsOnly?: string
  instanceMemory?: number
  kind?: string
  maximumInstanceCount?: number
  name: string
  resourceGroupName: string
  runtime?: string
  runtimeVersion?: string
  storageAccountConnectionStringName?: string
  storageConnectionString: string
  sourceCodeHash: string
}
