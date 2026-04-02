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

export interface ApiAuthKeyVault {
  name: string
  resourceGroupName: string
}

export interface AzureRestApiProps extends CommonAzureStackProps {
  apiAuthKeyVault: ApiAuthKeyVault
  apiManagement: ApiManagementProps
  apiManagementDiagnostic: ApiDiagnosticProps
  apiManagementDiagnosticSettings: MonitorDiagnosticSettingProps
}

export interface AzureApi {
  id: Input<string>
  name: Input<string>
  resourceGroupName: Input<string>
  authKeyVault: Output<GetVaultResult>
  apim: ApiManagementService
  namedValueSecret: Secret
  namedValueRoleAssignment: RoleAssignment
  logger: Logger
}
