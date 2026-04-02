import fs from 'fs'

import { Dashboard } from '@pulumi/azure-native/portal/index.js'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../index.js'

import { AzureDashboardRenderer } from './renderer.js'
import { PortalDashboardProps } from './types.js'

/**
 * @classdesc Provides operations on Azure Portal Dashboards using Pulumi
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
 *     this.azurePortalManager.createDashBoard('MyDashboard', this, props)
 *   }
 * }
 * ```
 */
export class AzurePortalManager {
  /**
   * @summary Method to create a new portal dashboard
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props  the dashboard properties
   * @param renderer An optional renderer to use
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Portal Dashboard]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/portal/dashboard/}
   */
  public createDashBoard(
    id: string,
    scope: CommonAzureConstruct,
    props: PortalDashboardProps,
    renderer?: AzureDashboardRenderer,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    const resourceGroup = scope.resourceGroupManager.resolveResourceGroup(
      scope,
      props.resourceGroupName.toString() ?? scope.props.resourceGroupName,
      resourceOptions
    )

    const dashboardName = scope.resourceNameFormatter.format(
      props.dashboardName?.toString(),
      scope.props.resourceNameOptions?.portalDashboard
    )

    const dashboardRenderer = renderer ?? new AzureDashboardRenderer()
    const templateFile = dashboardRenderer.renderToFile(dashboardName, props)
    const template = fs.readFileSync(templateFile, 'utf-8')
    const content = Object.entries(props.variables).reduce(
      (result, [key, value]) => result.replaceAll(`\${${key}}`, String(value)),
      template
    )

    return new Dashboard(
      `${id}-dashboard`,
      {
        ...props,
        dashboardName: scope.resourceNameFormatter.format(
          props.dashboardName?.toString(),
          scope.props.resourceNameOptions?.portalDashboard
        ),
        resourceGroupName: resourceGroup.name,
        location: props.location ?? resourceGroup.location,
        properties: JSON.parse(content),
        tags: {
          'hidden-title': `${props.location} - ${props.displayName}`,
        },
      },
      { ...resourceOptions, ignoreChanges: ['location'] }
    )
  }
}
