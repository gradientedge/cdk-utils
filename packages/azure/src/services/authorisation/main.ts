import { RoleAssignment } from '@pulumi/azure-native/authorization/index.js'
import { Input, ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { RoleDefinitionId } from './constants.js'
import { RoleAssignmentProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Authorisation using Pulumi
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```typescript
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(name: string, props: CommonAzureStackProps) {
 *     super(name, props)
 *     this.props = props
 *     this.authorisationManager.createRoleAssignment('MyRoleAssignment', this, props)
 *   }
 * }
 * ```
 */
export class AzureAuthorisationManager {
  /**
   * @summary Method to create a new role assignment
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props Role assignment properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Role Assignment]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/authorization/roleassignment/}
   */
  public createRoleAssignment(
    id: string,
    scope: CommonAzureConstruct,
    props: RoleAssignmentProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new RoleAssignment(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to grant a role assignment to key vault
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param vaultName the key vault name
   * @param resourceGroupName the resource group name
   * @param principalId the principal id to which the role is assigned to
   * @param roleDefinitionId the role definition id
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public grantRoleAssignmentToKeyVault(
    id: string,
    scope: CommonAzureConstruct,
    vaultName: string,
    resourceGroupName: string,
    principalId: Input<string>,
    roleDefinitionId: RoleDefinitionId,
    resourceOptions?: ResourceOptions
  ) {
    const keyVault = scope.keyVaultManager.resolveKeyVault(scope, vaultName, resourceGroupName, resourceOptions)
    return this.createRoleAssignment(
      `${id}-kv-role-${vaultName}`,
      scope,
      {
        principalId,
        roleDefinitionId,
        scope: keyVault.id,
      },
      resourceOptions
    )
  }

  /**
   * @summary Method to grant a role assignment to event grid topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param topicName the topic name
   * @param resourceGroupName the resource group name
   * @param principalId the principal id to which the role is assigned to
   * @param roleDefinitionId the role definition id
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public grantRoleAssignmentToEventgridTopic(
    id: string,
    scope: CommonAzureConstruct,
    topicName: string,
    resourceGroupName: string,
    principalId: Input<string>,
    roleDefinitionId: RoleDefinitionId,
    resourceOptions?: ResourceOptions
  ) {
    const topic = scope.eventgridManager.resolveEventgridTopic(
      `${id}-egt-role-${topicName}`,
      scope,
      {
        topicName,
        resourceGroupName,
      },
      resourceOptions
    )
    return this.createRoleAssignment(
      `${id}-egt-role-${topicName}`,
      scope,
      {
        principalId,
        roleDefinitionId,
        scope: topic.id,
      },
      resourceOptions
    )
  }

  /**
   * @summary Method to grant a role assignment to application configuration
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param appConfigId the application configuration id
   * @param principalId the principal id to which the role is assigned to
   * @param roleDefinitionId the role definition id
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public grantRoleAssignmentToApplicationConfiguration(
    id: string,
    scope: CommonAzureConstruct,
    appConfigId: Input<string>,
    principalId: Input<string>,
    roleDefinitionId: RoleDefinitionId,
    resourceOptions?: ResourceOptions
  ) {
    return this.createRoleAssignment(
      `${id}-ac-role`,
      scope,
      {
        principalId,
        roleDefinitionId,
        scope: appConfigId,
      },
      resourceOptions
    )
  }

  /**
   * @summary Method to grant a role assignment to storage account
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param accountId the storage account id
   * @param principalId the principal id to which the role is assigned to
   * @param roleDefinitionId the role definition id
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public grantRoleAssignmentToStorageAccount(
    id: string,
    scope: CommonAzureConstruct,
    accountId: Input<string>,
    principalId: Input<string>,
    roleDefinitionId: RoleDefinitionId,
    resourceOptions?: ResourceOptions
  ) {
    return this.createRoleAssignment(
      `${id}-sa-role`,
      scope,
      {
        principalId,
        roleDefinitionId,
        scope: accountId,
      },
      resourceOptions
    )
  }

  /**
   * @summary Method to grant a role assignment to storage table
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param tableId the storage table id
   * @param principalId the principal id to which the role is assigned to
   * @param roleDefinitionId the role definition id
   * @param resourceOptions Optional settings to control resource behaviour
   */
  public grantRoleAssignmentToStorageTable(
    id: string,
    scope: CommonAzureConstruct,
    tableId: Input<string>,
    principalId: Input<string>,
    roleDefinitionId: RoleDefinitionId,
    resourceOptions?: ResourceOptions
  ) {
    return this.createRoleAssignment(
      `${id}-st-role`,
      scope,
      {
        principalId,
        roleDefinitionId,
        scope: tableId,
      },
      resourceOptions
    )
  }
}
