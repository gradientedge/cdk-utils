import {
  AppConfigurationProps,
  CommonAzureStackProps,
  ContainerSasTokenProps,
  FunctionAppFlexConsumptionProps,
  PortalDashboardProps,
  ServicePlanProps,
  StorageAccountProps,
  StorageContainerProps,
} from '../../index.js'

export interface OtelProps {
  otelTracesSamplerArg: string
}

export interface FunctionAppProperties {
  app: FunctionAppFlexConsumptionProps
  appConfiguration: AppConfigurationProps
  dashboard: PortalDashboardProps
  deploymentStorageContainer: StorageContainerProps
  deploySource: string
  hostsConfiguration?: string
  packageName: string
  servicePlan: ServicePlanProps
  storageAccount: StorageAccountProps
  storageContainer: StorageContainerProps
  timerTriggerCronExpression: string
}

export interface AzureFunctionAppProps extends CommonAzureStackProps {
  existingTopicName: string
  existingTopicResourceGroupName: string
  existingCosmosAccountResourceGroupName: string
  existingCosmosAccountName: string
  hostsConfiguration: any
  existingConfigStoreResourceGroupName: string
  existingConfigStoreName: string
  functionApp: FunctionAppProperties
  useConfigOverride?: boolean
  dataStorageContainer: StorageContainerProps
  dataStorageAccount: StorageAccountProps
  dataStorageContainerSas: ContainerSasTokenProps
  dataKeyVaultName: string
  dataKeyVaultSecretName: string
}
