import { ManagementLockByScopeArgs, RoleAssignmentArgs } from '@pulumi/azure-native/authorization/index.js'

/**
 * Properties for creating an Azure management lock by scope
 * @see [Pulumi Azure Native Management Lock By Scope]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/authorization/managementlockbyscope/}
 * @category Interface
 */
export interface ManagementLockByScopeProps extends ManagementLockByScopeArgs {}

/**
 * Properties for creating an Azure role assignment
 * @see [Pulumi Azure Native Role Assignment]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/authorization/roleassignment/}
 * @category Interface
 */
export interface RoleAssignmentProps extends RoleAssignmentArgs {}
