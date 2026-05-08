import fs from 'fs'

import {
  ApplicationType,
  Component,
  ComponentCurrentBillingFeature,
  Workbook,
  WorkbookSharedTypeKind,
} from '@pulumi/azure-native/applicationinsights/index.js'
import * as pulumi from '@pulumi/pulumi'
import { ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import { AzureWorkbookRenderer } from './renderer.js'
import { ApplicationInsightsProps, ComponentCurrentBillingFeatureProps, WorkbookProps } from './types.js'

/**
 * Provides operations on Azure Application Insights using Pulumi
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
 * @category Service
 */
export class AzureApplicationInsightsManager {
  /**
   * @summary Method to create a new application insights component
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props application insights component properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Application Insights Component]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/component/}
   */
  public createComponent(
    id: string,
    scope: CommonAzureConstruct,
    props: ApplicationInsightsProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

    const resourceName = scope.resourceNameFormatter.format(
      props.resourceName?.toString(),
      scope.props.resourceNameOptions?.applicationInsights
    )

    const component = new Component(
      `${id}`,
      {
        ...props,
        resourceName,
        resourceGroupName,
        applicationType: props.applicationType ?? ApplicationType.Web,
        kind: props.kind ?? 'web',
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )

    if (props.billingFeatures) {
      this.createComponentCurrentBillingFeature(
        `${id}-billing`,
        scope,
        {
          ...props.billingFeatures,
          currentBillingFeatures: props.billingFeatures?.currentBillingFeatures ?? ['Basic'],
          resourceName,
          resourceGroupName,
        },
        {
          parent: scope,
          ...resourceOptions,
        }
      )
    }

    return component
  }

  /**
   * @summary Method to create a new application insights component billing feature
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props application insights properties component billing featureø
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Application Insights Billing Feature]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/insights/componentcurrentbillingfeature/}
   */
  public createComponentCurrentBillingFeature(
    id: string,
    scope: CommonAzureConstruct,
    props: ComponentCurrentBillingFeatureProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new ComponentCurrentBillingFeature(`${id}`, props, { parent: scope, ...resourceOptions })
  }

  /**
   * @summary Method to create a new application insights workbook
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props application insights workbook properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Application Insights Billing Feature]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/applicationinsights/workbook/}
   */
  public createWorkbook(
    id: string,
    scope: CommonAzureConstruct,
    props: WorkbookProps,
    renderer?: AzureWorkbookRenderer,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroup =
      scope.resourceGroup ??
      scope.resourceGroupManager.resolveResourceGroup(
        scope,
        props.resourceGroupName.toString() ?? scope.props.resourceGroupName,
        resourceOptions
      )

    const workbookRenderer = renderer ?? new AzureWorkbookRenderer()
    const templateFile = workbookRenderer.renderToFile(props.slug, props.templateId, props.variables)
    const template = fs.readFileSync(templateFile, 'utf-8')
    const keys = Object.keys(props.variables)
    const values = Object.values(props.variables)

    const properties = pulumi.all(values).apply(resolved => {
      const content = keys.reduce(
        (result, key, i) => result.replaceAll(`\${${key}}`, JSON.stringify(String(resolved[i])).slice(1, -1)),
        template
      )
      return JSON.parse(content)
    })

    return new Workbook(
      `${id}`,
      {
        ...props,
        displayName: `${props.location} - ${props.displayName}`,
        resourceGroupName: resourceGroup.name,
        location: props.location ?? resourceGroup.location,
        kind: props.kind ?? WorkbookSharedTypeKind.Shared,
        serializedData: properties.apply(p => JSON.stringify(p)),
        sourceId: props.sourceId?.toString().toLowerCase(),
        category: props.category ?? 'workbook',
      },
      { parent: scope, ...resourceOptions, ignoreChanges: ['location'] }
    )
  }
}
