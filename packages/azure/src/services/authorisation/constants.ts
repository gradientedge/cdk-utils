/**
 * @summary Enumerations for publicly available built in RBAC roles
 * @see https://learn.microsoft.com/en-us/azure/role-based-access-control/built-in-roles
 */
/** @category Enum */
export enum RoleDefinitionId {
  APP_CONFIGURATION_DATA_READER = '/providers/Microsoft.Authorization/roleDefinitions/516239f1-63e1-4d78-a4de-a74fb236a071',
  APP_CONFIGURATION_DATA_OWNER = '/providers/Microsoft.Authorization/roleDefinitions/5ae67dd6-50cb-40e7-96ff-dc2bfa4b606b',
  EVENTGRID_DATA_SENDER = '/providers/Microsoft.Authorization/roleDefinitions/d5a91429-5739-47e2-a06b-3470a27159e7',
  KEY_VAULT_CERTIFICATE_USER = '/providers/Microsoft.Authorization/roleDefinitions/db79e9a7-68ee-4b58-9aeb-b90e7c24fcba',
  KEY_VAULT_SECRETS_USER = '/providers/Microsoft.Authorization/roleDefinitions/4633458b-17de-408a-b874-0445c86b69e6',
  STORAGE_BLOB_DATA_CONTRIBUTOR = '/providers/Microsoft.Authorization/roleDefinitions/ba92f5b4-2d11-453d-a403-e96b0029c9fe',
  STORAGE_TABLE_DATA_CONTRIBUTOR = '/providers/Microsoft.Authorization/roleDefinitions/0a9a7e1f-b9d0-4cc4-a60d-0319b160aaa3',
}
