export enum AzureRemoteBackend {
  local = 'local',
  azurerm = 'azurerm',
}

/**
 * List of Azure resources that excludes tags
 */
export const RESOURCES_TO_EXCLUDE_TAGS = new Set(['ApiManagementNamedValue', 'Application', 'ServicePrincipal'])
