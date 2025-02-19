import { LinuxFunctionAppConfig } from '@cdktf/provider-azurerm/lib/linux-function-app'
import { FunctionAppFunctionConfig } from '@cdktf/provider-azurerm/lib/function-app-function'
import { ResourceConfig } from '../../.gen/providers/azapi/resource'

export interface FunctionAppProps extends LinuxFunctionAppConfig {}

export interface FunctionProps extends FunctionAppFunctionConfig {}

export interface FunctionAppFlexConsumptionProps {
  name: string
  kind?: string
  httpsOnly?: string
  resourceGroupName: string
  appServicePlanId: string
  runtime?: string
  runtimeVersion?: string
  blobEndpoint: string
  containerName: string
  storageConnectionString: string
  deploymentStorageType?: string
  appSettings: any
  deploymentAuthenticationType?: string
  storageAccountConnectionStringName?: string
  instanceMemory?: number
  maximumInstanceCount?: number
}
