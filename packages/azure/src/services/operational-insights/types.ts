import { TableArgs, WorkspaceArgs } from '@pulumi/azure-native/operationalinsights/index.js'

/**
 * Properties for creating a Log Analytics workspace
 * @see [Pulumi Azure Native Operational Insights Workspace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/operationalinsights/workspace/}
 * @category Interface
 */
export interface WorkspaceProps extends WorkspaceArgs {}

/**
 * Properties for creating a Log Analytics workspace table
 * @see [Pulumi Azure Native Operational Insights Table]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/operationalinsights/table/}
 * @category Interface
 */
export interface WorkspaceTableProps extends TableArgs {}
