import { DataAzurermResourceGroup } from '@cdktf/provider-azurerm/lib/data-azurerm-resource-group'
import { ApplicationInsights } from '@cdktf/provider-azurerm/lib/application-insights'
import { CommonAzureConstruct } from '../../common'
import { createAzureTfOutput } from '../../utils'
import { ApplicationInsightsProps } from './types'

/**
 * @classdesc Provides operations on Azure Application Insights
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
 *     this.applicationInsightseManager.createApplicationInsights('MyApplicationInsights', this, props)
 *   }
 * }
 * ```
 */
export class AzureApplicationInsightsManager {
  /**
   * @summary Method to create a new application insights
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props application insights properties
   * @see [CDKTF Application insights Module]{@link https://github.com/cdktf/cdktf-provider-azurerm/blob/main/docs/applicationInsights.typescript.md}
   */
  public createApplicationInsights(id: string, scope: CommonAzureConstruct, props: ApplicationInsightsProps) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = new DataAzurermResourceGroup(scope, `${id}-am-rg`, {
      name: scope.resourceNameFormatter.format(
        scope.props.resourceGroupName || props.resourceGroupName,
        scope.props.resourceNameOptions?.resourceGroup
      ),
    })

    if (!resourceGroup) throw `Resource group undefined for ${id}`

    const applicationInsights = new ApplicationInsights(scope, `${id}-am`, {
      ...props,
      name: `${props.name}-${scope.props.stage}` || '',
      resourceGroupName: resourceGroup.name,
      applicationType: props.applicationType || 'web',
      tags: props.tags ?? {
        environment: scope.props.stage,
      },
    })

    createAzureTfOutput(`${id}-applicationInsightsName`, scope, applicationInsights.name)
    createAzureTfOutput(`${id}-applicationInsightsFriendlyUniqueId`, scope, applicationInsights.friendlyUniqueId)
    createAzureTfOutput(`${id}-applicationInsightsId`, scope, applicationInsights.id)

    return applicationInsights
  }
}
