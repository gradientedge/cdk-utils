import { ApiManagementService, Logger } from '@pulumi/azure-native/apimanagement/index.js'
import { RoleAssignment } from '@pulumi/azure-native/authorization/index.js'
import { GetVaultResult, Secret } from '@pulumi/azure-native/keyvault/index.js'
import { Input, Output } from '@pulumi/pulumi'

import {
  ApiDiagnosticProps,
  ApiManagementProps,
  CommonAzureStackProps,
  MonitorDiagnosticSettingProps,
} from '../../index.js'

/**
 * Key Vault reference for API authentication secrets
 * @category Interface
 */
export interface ApiAuthKeyVault {
  /** Name of the Key Vault containing API authentication secrets */
  name: Input<string>
  /** Resource group containing the authentication Key Vault */
  resourceGroupName: Input<string>
}

/**
 * Properties for the {@link AzureRestApi} construct
 * @category Interface
 */
export interface AzureRestApiProps extends CommonAzureStackProps {
  /** Key Vault reference for API authentication secrets */
  apiAuthKeyVault: ApiAuthKeyVault
  /** API Management service properties */
  apiManagement: ApiManagementProps
  /** API diagnostic properties for logging */
  apiManagementDiagnostic: ApiDiagnosticProps
  /** Monitor diagnostic settings for the API Management service */
  apiManagementDiagnosticSettings: MonitorDiagnosticSettingProps
}

/**
 * Provisioned API Management resources
 * @category Interface
 */
export interface AzureApi {
  /** The API Management service resource ID */
  id: Input<string>
  /** The API Management service name */
  name: Input<string>
  /** The resource group name of the API Management service */
  resourceGroupName: Input<string>
  /** The resolved authentication Key Vault */
  authKeyVault: Output<GetVaultResult>
  /** The provisioned API Management service */
  apim: ApiManagementService
  /** The Key Vault secret for the Application Insights instrumentation key */
  namedValueSecret: Secret
  /** Role assignment granting the APIM identity access to the Key Vault */
  namedValueRoleAssignment: RoleAssignment
  /** The provisioned API Management logger for Application Insights */
  logger: Logger
}
