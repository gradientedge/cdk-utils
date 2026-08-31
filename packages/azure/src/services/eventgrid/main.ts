import { Deployment, DeploymentMode } from '@pulumi/azure-native/resources/index.js'
import {
  DataResidencyBoundary,
  EventDeliverySchema,
  EventSubscription,
  getNamespaceOutput,
  getNamespaceTopicOutput,
  GetSystemTopicResult,
  getTopicOutput,
  getSystemTopicOutput,
  Namespace,
  NamespaceTopic,
  SystemTopic,
  SystemTopicEventSubscription,
  TlsVersion,
  Topic,
} from '@pulumi/azure-native/eventgrid/index.js'
import { eventgrid as eventgridInputs } from '@pulumi/azure-native/types/input.js'
import { all, Input, Output, output, ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import {
  EventgridEventSubscriptionProps,
  EventgridNamespaceAutoScaleConfigurationProps,
  EventgridNamespaceProps,
  EventgridNamespaceTopicProps,
  EventgridSystemTopicEventSubscriptionProps,
  EventgridSystemTopicProps,
  EventgridTopicProps,
  ResolveEventgridNamespaceProps,
  ResolveEventgridNamespaceTopicProps,
  ResolveEventgridTopicProps,
  ResolveEventgridSystemTopicProps,
} from './types.js'

/**
 * Provides operations on Azure Event Grid using Pulumi
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
 *     this.EventGridManager.createEventgridTopic('MyEventGrid', this, props)
 *   }
 * }
 * ```
 * @category Service
 */
export class AzureEventgridManager {
  /**
   * @summary Method to create a new eventgrid topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid topic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/topic/}
   */
  public createEventgridTopic(
    id: string,
    scope: CommonAzureConstruct,
    props: EventgridTopicProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    // Get resource group name
    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new Topic(
      `${id}-et`,
      {
        ...props,
        topicName: scope.resourceNameFormatter.format(
          props.topicName?.toString(),
          scope.props.resourceNameOptions?.eventGridTopic
        ),
        location: props.location ?? scope.props.location,
        resourceGroupName,
        dataResidencyBoundary: props.dataResidencyBoundary ?? DataResidencyBoundary.WithinGeopair,
        minimumTlsVersionAllowed: props.minimumTlsVersionAllowed ?? TlsVersion.TlsVersion_1_2,
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to resolve an existing eventgrid topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid topic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid Topic Lookup]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/topic/}
   */
  public resolveEventgridTopic(
    id: string,
    scope: CommonAzureConstruct,
    props: ResolveEventgridTopicProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return getTopicOutput(
      {
        topicName: scope.resourceNameFormatter.format(
          props.topicName?.toString(),
          scope.props.resourceNameOptions?.eventGridTopic
        ),
        resourceGroupName: props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName),
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new eventgrid namespace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid namespace properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid Namespace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespace/}
   */
  public createEventgridNamespace(
    id: string,
    scope: CommonAzureConstruct,
    props: EventgridNamespaceProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const { autoScaleConfiguration, ...namespaceProps } = props

    const resourceGroupName =
      namespaceProps.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    const namespaceName = scope.resourceNameFormatter.format(
      namespaceProps.namespaceName?.toString(),
      scope.props.resourceNameOptions?.eventGridNamespace
    )
    const location = namespaceProps.location ?? scope.props.location
    const sku = output(namespaceProps.sku).apply(value => value ?? { name: 'Standard' })
    const tags = output(namespaceProps.tags).apply(resolvedTags => ({
      environment: scope.props.stage,
      ...scope.props.defaultTags,
      ...resolvedTags,
    }))

    const namespace = new Namespace(
      `${id}-ens`,
      {
        ...namespaceProps,
        namespaceName,
        location,
        resourceGroupName,
        sku,
        tags,
      },
      { parent: scope, ...resourceOptions }
    )

    if (autoScaleConfiguration) {
      this.createEventgridNamespaceAutoScaleDeployment(
        id,
        scope,
        namespace,
        resourceGroupName,
        sku,
        tags,
        autoScaleConfiguration,
        resourceOptions
      )
    }

    return namespace
  }

  /**
   * Enables Event Grid namespace autoscale through an ARM deployment while the
   * generated Pulumi Native Namespace resource does not expose autoScaleConfiguration.
   */
  private createEventgridNamespaceAutoScaleDeployment(
    id: string,
    scope: CommonAzureConstruct,
    namespace: Namespace,
    resourceGroupName: Input<string>,
    sku: Input<eventgridInputs.NamespaceSkuArgs>,
    tags: Input<Record<string, Input<string>>>,
    autoScaleConfiguration: EventgridNamespaceAutoScaleConfigurationProps,
    resourceOptions?: ResourceOptions
  ) {
    const template = all([
      namespace.name,
      namespace.location,
      output(sku),
      output(tags),
      output(autoScaleConfiguration.enableAutoScale),
      output(autoScaleConfiguration.minimumThroughputUnits ?? 1),
      output(autoScaleConfiguration.maximumThroughputUnits ?? 10),
    ]).apply(
      ([
        namespaceName,
        location,
        resolvedSku,
        resolvedTags,
        enableAutoScale,
        minimumThroughputUnits,
        maximumThroughputUnits,
      ]) => ({
        $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
        contentVersion: '1.0.0.0',
        resources: [
          {
            type: 'Microsoft.EventGrid/namespaces',
            apiVersion: '2025-11-15-preview',
            name: namespaceName,
            location,
            tags: resolvedTags,
            sku: {
              name: resolvedSku.name,
              capacity: minimumThroughputUnits,
            },
            properties: {
              autoScaleConfiguration: {
                enableAutoScale,
                minimumThroughputUnits,
                maximumThroughputUnits,
              },
            },
          },
        ],
      })
    )

    return new Deployment(
      `${id}-ens-autoscale`,
      {
        resourceGroupName,
        deploymentName: scope.resourceNameFormatter.format(`${id}-ens-autoscale`),
        properties: {
          mode: DeploymentMode.Incremental,
          template,
        },
      },
      { ...resourceOptions, parent: namespace, dependsOn: [namespace] }
    )
  }

  /**
   * @summary Method to resolve an existing eventgrid namespace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid namespace properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid Namespace Lookup]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespace/}
   */
  public resolveEventgridNamespace(
    id: string,
    scope: CommonAzureConstruct,
    props: ResolveEventgridNamespaceProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return getNamespaceOutput(
      {
        namespaceName: scope.resourceNameFormatter.format(
          props.namespaceName?.toString(),
          scope.props.resourceNameOptions?.eventGridNamespace
        ),
        resourceGroupName: props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName),
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new eventgrid namespace topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid namespace topic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid Namespace Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespacetopic/}
   */
  public createEventgridNamespaceTopic(
    id: string,
    scope: CommonAzureConstruct,
    props: EventgridNamespaceTopicProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new NamespaceTopic(
      `${id}-ent`,
      {
        ...props,
        namespaceName: scope.resourceNameFormatter.format(
          props.namespaceName?.toString(),
          scope.props.resourceNameOptions?.eventGridNamespace
        ),
        topicName: scope.resourceNameFormatter.format(
          props.topicName?.toString(),
          scope.props.resourceNameOptions?.eventGridNamespaceTopic
        ),
        resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to resolve an existing eventgrid namespace topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid namespace topic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid Namespace Topic Lookup]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/namespacetopic/}
   */
  public resolveEventgridNamespaceTopic(
    id: string,
    scope: CommonAzureConstruct,
    props: ResolveEventgridNamespaceTopicProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return getNamespaceTopicOutput(
      {
        namespaceName: scope.resourceNameFormatter.format(
          props.namespaceName?.toString(),
          scope.props.resourceNameOptions?.eventGridNamespace
        ),
        topicName: scope.resourceNameFormatter.format(
          props.topicName?.toString(),
          scope.props.resourceNameOptions?.eventGridNamespaceTopic
        ),
        resourceGroupName: props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName),
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new eventgrid subscription
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid subscription properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid Event Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/eventsubscription/}
   */
  public createEventgridSubscription(
    id: string,
    scope: CommonAzureConstruct,
    props: EventgridEventSubscriptionProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new EventSubscription(
      `${id}-es`,
      {
        ...props,
        eventSubscriptionName: scope.resourceNameFormatter.format(
          props.eventSubscriptionName?.toString(),
          scope.props.resourceNameOptions?.eventGridEventSubscription
        ),
        eventDeliverySchema: props.eventDeliverySchema ?? EventDeliverySchema.CloudEventSchemaV1_0,
        retryPolicy: props.retryPolicy ?? {
          eventTimeToLiveInMinutes: 1440,
          maxDeliveryAttempts: 7,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new eventgrid system topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid system topic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid System Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/systemtopic/}
   */
  public createEventgridSystemTopic(
    id: string,
    scope: CommonAzureConstruct,
    props: EventgridSystemTopicProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new SystemTopic(
      `${id}-est`,
      {
        ...props,
        systemTopicName: scope.resourceNameFormatter.format(
          props.systemTopicName?.toString(),
          scope.props.resourceNameOptions?.eventGridSystemTopic
        ),
        location: props.location ?? scope.props.location,
        resourceGroupName,
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...props.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new eventgrid system topic subscription
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid system topic subscription properties
   * @param systemTopic The system topic to attach this subscription to
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid System Topic Event Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/systemtopiceventsubscription/}
   */
  public createEventgridSystemTopicEventSubscription(
    id: string,
    scope: CommonAzureConstruct,
    props: EventgridSystemTopicEventSubscriptionProps,
    systemTopic: SystemTopic | Output<GetSystemTopicResult>,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    const resourceGroupName =
      props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    return new SystemTopicEventSubscription(
      `${id}-ests`,
      {
        ...props,
        eventSubscriptionName: scope.resourceNameFormatter.format(
          props.eventSubscriptionName?.toString(),
          scope.props.resourceNameOptions?.eventGridSystemTopicEventSubscription
        ),
        systemTopicName: systemTopic.name,
        resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to resolve an existing eventgrid system topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props eventgrid system topic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Event Grid System Topic Lookup]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/eventgrid/getsystemtopic/}
   */
  public resolveEventgridSystemTopic(
    id: string,
    scope: CommonAzureConstruct,
    props: ResolveEventgridSystemTopicProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return getSystemTopicOutput(
      {
        systemTopicName:
          props.systemTopicName ??
          scope.resourceNameFormatter.format(
            props.systemTopicName,
            scope.props.resourceNameOptions?.eventGridSystemTopic
          ),
        resourceGroupName: props.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName),
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
