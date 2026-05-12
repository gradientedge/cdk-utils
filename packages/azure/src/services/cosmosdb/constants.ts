/**
 * CosmosDB SQL role definition types
 * @see https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-setup-rbac
 * @category Enum
 */
export enum CosmosRoleDefinition {
  /** Full read-write access to CosmosDB SQL data */
  CONTRIBUTOR = 'CONTRIBUTOR',
  /** Read-only access to CosmosDB SQL data */
  READER = 'READER',
}

/**
 * Built-in CosmosDB SQL role definition GUIDs
 * @see https://learn.microsoft.com/en-us/azure/cosmos-db/how-to-setup-rbac#built-in-role-definitions
 * @category Enum
 */
export enum CosmosRoleDefinitionId {
  /** Built-in Cosmos DB Data Contributor role GUID */
  CONTRIBUTOR = '00000000-0000-0000-0000-000000000001',
  /** Built-in Cosmos DB Data Reader role GUID */
  READER = '00000000-0000-0000-0000-000000000002',
}
