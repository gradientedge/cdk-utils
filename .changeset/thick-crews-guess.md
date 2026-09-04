---
'@gradientedge/cdk-utils-azure': patch
---

fix(azure): scope APIM certificate kv-role RoleAssignment to an ARM resource ID instead of the Key Vault secret URI

The `kv-role` RoleAssignment created in `AzureRestApi`/`AzureRestApiFunction` used
`certificateKeyVaultId` (a Key Vault secret data-plane URI) directly as the RBAC `scope`.
Azure rejects this with `Status=404 Code="MissingSubscription"` since role assignment
scopes must be ARM resource IDs, not data-plane URIs. This only surfaced when an APIM
instance's managed identity changed (e.g. after delete/recreate), since the resource was
otherwise never actually created.

Added optional `certificateKeyVaultName`, `certificateKeyVaultResourceGroupName`, and
`certificateKeyVaultSecretName` to `ApiManagementProps`. When the vault name and resource
group are supplied, the RoleAssignment now scopes to the vault's ARM resource ID, narrowed
to the specific secret when `certificateKeyVaultSecretName` is also provided. Without these
new props, behaviour is unchanged, so existing consumers are unaffected.
