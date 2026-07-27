import { AutoscaleSettingArgs, DiagnosticSettingArgs } from '@pulumi/azure-native/monitor/index.js'

/**
 * Properties for creating an Azure Monitor diagnostic setting
 * @see [Pulumi Azure Native Monitor Diagnostic Settings]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/diagnosticsetting/}
 * @category Interface
 */
export interface MonitorDiagnosticSettingProps extends DiagnosticSettingArgs {}

/**
 * Properties for creating an Azure Monitor autoscale setting
 * @see [Pulumi Azure Native Monitor Autoscale Setting]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/monitor/autoscalesetting/}
 * @category Interface
 */
export interface MonitorAutoscaleSettingProps extends AutoscaleSettingArgs {}
