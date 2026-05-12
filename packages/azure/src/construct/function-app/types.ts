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

/**
 * Properties for configuring OpenTelemetry tracing
 * @category Interface
 */
export interface OtelProps {
  /** Sampling argument for the OpenTelemetry traces sampler */
  otelTracesSamplerArg: string
}

/**
 * Properties for configuring the Azure Function App resources
 * @category Interface
 */
export interface FunctionAppProperties {
  /** Flex consumption function app configuration */
  app?: FunctionAppFlexConsumptionProps
  /** App Configuration store properties for function settings */
  appConfiguration: AppConfigurationProps
  /** Azure Portal dashboard properties for monitoring */
  dashboard: PortalDashboardProps
  /** Storage container for function deployment artifacts */
  deploymentStorageContainer: StorageContainerProps
  /** Relative path to the function app deployment source directory */
  deploySource: string
  /** Custom host.json configuration to merge with the source host.json */
  hostsConfiguration?: string
  /** Name of the deployment package archive file */
  packageName: string
  /** App Service Plan properties for the function app */
  servicePlan: ServicePlanProps
  /** Storage account properties for the function app */
  storageAccount: StorageAccountProps
  /** Storage container properties for function app data */
  storageContainer: StorageContainerProps
  /** Cron expression for timer-triggered functions */
  timerTriggerCronExpression: string
}

/**
 * Properties for the {@link AzureFunctionApp} construct
 * @category Interface
 */
export interface AzureFunctionAppProps extends CommonAzureStackProps {
  /** Name of the existing EventGrid topic for event publishing */
  existingTopicName: string
  /** Resource group name of the existing EventGrid topic */
  existingTopicResourceGroupName: string
  /** Resource group name of the existing CosmosDB account */
  existingCosmosAccountResourceGroupName: string
  /** Name of the existing CosmosDB account */
  existingCosmosAccountName: string
  /** Custom host.json configuration to merge at the stack level */
  hostsConfiguration: any
  /** Resource group name of the existing App Configuration store */
  existingConfigStoreResourceGroupName: string
  /** Name of the existing App Configuration store */
  existingConfigStoreName: string
  /** Function app resource properties */
  functionApp: FunctionAppProperties
  /** When true, bypasses App Configuration store and uses config overrides */
  useConfigOverride?: boolean
  /** Data storage container properties for the function app */
  dataStorageContainer: StorageContainerProps
  /** Data storage account properties for the function app */
  dataStorageAccount: StorageAccountProps
  /** SAS token properties for the data storage container */
  dataStorageContainerSas: ContainerSasTokenProps
  /** Name of the Key Vault for storing the data SAS token */
  dataKeyVaultName: string
  /** Name of the Key Vault secret for the data SAS token */
  dataKeyVaultSecretName: string
}
