import { MonitorDiagnosticSetting } from '@cdktf/provider-azurerm/lib/monitor-diagnostic-setting'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { MonitorDiagnosticSettingProps } from './types'

/**
 * @classdesc Provides operations on Azure Key Vault
 * - A new instance of this class is injected into {@link CommonAzureConstruct} constructor.
 * - If a custom construct extends {@link CommonAzureConstruct}, an instance is available within the context.
 * @example
 * ```
 * import { CommonAzureConstruct, CommonAzureStackProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends CommonAzureConstruct {
 *   constructor(parent: Construct, id: string, props: CommonAzureStackProps) {
 *     super(parent, id, props)
 *     this.props = props
 *     this.monitorManager.createMonitor('MyMonitor', this, props)
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
   * @see [CDKTF Monitor Diagnostics Settings Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/monitorDiagnosticSetting.typescript.md}
   */
  public createMonitorDiagnosticSettings(
    id: string,
    scope: CommonAzureConstruct,
    props: MonitorDiagnosticSettingProps
  ) {
    if (!props) throw `Props undefined for ${id}`

    const monitorDiagnosticSetting = new MonitorDiagnosticSetting(scope, `${id}-ds`, {
      ...props,
      name: scope.resourceNameFormatter.format(props.name, scope.props.resourceNameOptions?.monitorDiagnosticSetting),
    })

    createAzureTfOutput(`${id}-monitorDiagnosticSettingName`, scope, monitorDiagnosticSetting.name)
    createAzureTfOutput(
      `${id}-monitorDiagnosticSettingFriendlyUniqueId`,
      scope,
      monitorDiagnosticSetting.friendlyUniqueId
    )
    createAzureTfOutput(`${id}-monitorDiagnosticSettingId`, scope, monitorDiagnosticSetting.id)

    return monitorDiagnosticSetting
  }
}
