export enum AzureRemoteBackend {
  azurerm = 'azurerm',
  pulumi = 'pulumi',
  local = 'local',
}

/**
 * List of Azure resources that excludes tags
 */
export const RESOURCES_TO_EXCLUDE_TAGS = new Set(['ApiManagementNamedValue', 'Application', 'ServicePrincipal'])
