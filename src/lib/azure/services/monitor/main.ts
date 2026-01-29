import { DiagnosticSetting } from '@pulumi/azure-native/monitor/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { MonitorDiagnosticSettingProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Monitor using Pulumi
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
 *     this.monitorManager.createMonitorDiagnosticSettings('MyMonitor', this, props)
 *   }
 * }
 * ```
 */
export class AzureMonitorManager {
  /**
   * @summary Method to create a new monitor diagnostic setting
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props monitor diagnostics settings properties
   * @see [Pulumi Azure Native Monitor Diagnostic Settings]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/diagnosticsetting/}
   */
  public createMonitorDiagnosticSettings(
    id: string,
    scope: CommonAzureConstruct,
    props: MonitorDiagnosticSettingProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new DiagnosticSetting(
      `${id}-ds`,
      {
        ...props,
        name: scope.resourceNameFormatter.format(
          props.name?.toString(),
          scope.props.resourceNameOptions?.monitorDiagnosticSetting
        ),
      },
      { parent: scope }
    )
  }
}
