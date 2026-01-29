/**
 * @fileoverview Azure utility functions for Pulumi
 *
 * Note: Pulumi automatically exposes resource properties as outputs.
 * Unlike CDKTF, explicit output creation is not required.
 * Resource properties are already pulumi.Output<T> types and can be
 * exported directly or used with .apply() for transformations.
 *
 * @example
 * ```typescript
 * // In CDKTF (old):
 * createAzureTfOutput('resourceGroupName', scope, resourceGroup.name)
 *
 * // In Pulumi (new):
 * // No explicit output creation needed - resourceGroup.name is already an output
 * export const resourceGroupName = resourceGroup.name
 * ```
 */

// Utility functions can be added here as needed for Pulumi Azure operations
export {}
