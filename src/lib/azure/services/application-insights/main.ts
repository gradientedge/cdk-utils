import { ApplicationType, Component } from '@pulumi/azure-native/applicationinsights/index.js'
import { CommonAzureConstruct } from '../../common/index.js'
import { ApplicationInsightsProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Application Insights using Pulumi
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
 *     this.applicationInsightsManager.createApplicationInsights('MyApplicationInsights', this, props)
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
   * @see [Pulumi Azure Native Application Insights Component]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/component/}
   */
  public createComponent(id: string, scope: CommonAzureConstruct, props: ApplicationInsightsProps) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? `${scope.props.resourceGroupName}-${scope.props.stage}`
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new Component(
      `${id}-ai`,
      {
        ...props,
        resourceName: scope.resourceNameFormatter.format(
          props.resourceName?.toString(),
          scope.props.resourceNameOptions?.applicationInsights
        ),
        resourceGroupName: resourceGroupName,
        applicationType: (props.applicationType as any) ?? ApplicationType.Web,
        kind: props.kind ?? 'web',
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope }
    )
  }
}
