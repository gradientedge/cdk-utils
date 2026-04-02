import {
  EventDeliverySchema,
  EventSubscription,
  GetSystemTopicResult,
  getTopicOutput,
  SystemTopic,
  SystemTopicEventSubscription,
  Topic,
} from '@pulumi/azure-native/eventgrid/index.js'
import { Output, ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import {
  EventgridEventSubscriptionProps,
  EventgridSystemTopicEventSubscriptionProps,
  EventgridSystemTopicProps,
  EventgridTopicProps,
  ResolveEventgridTopicProps,
} from './types.js'

/**
 * @classdesc Provides operations on Azure Event Grid using Pulumi
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
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

    return new Topic(
      `${id}-et`,
      {
        ...props,
        topicName: scope.resourceNameFormatter.format(
          props.topicName?.toString(),
          scope.props.resourceNameOptions?.eventGridTopic
        ),
        location: props.location ?? scope.props.location,
        resourceGroupName: resourceGroupName,
        tags: props.tags ?? {
          environment: scope.props.stage,
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
        resourceGroupName: scope.props.resourceGroupName
          ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
          : props.resourceGroupName,
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

    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

    return new SystemTopic(
      `${id}-est`,
      {
        ...props,
        systemTopicName: scope.resourceNameFormatter.format(
          props.systemTopicName?.toString(),
          scope.props.resourceNameOptions?.eventGridSystemTopic
        ),
        location: props.location ?? scope.props.location,
        resourceGroupName: resourceGroupName,
        tags: props.tags ?? {
          environment: scope.props.stage,
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

    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw new Error(`Resource group name undefined for ${id}`)

    return new SystemTopicEventSubscription(
      `${id}-ests`,
      {
        ...props,
        eventSubscriptionName: scope.resourceNameFormatter.format(
          props.eventSubscriptionName?.toString(),
          scope.props.resourceNameOptions?.eventGridSystemTopicEventSubscription
        ),
        systemTopicName: systemTopic.name,
        resourceGroupName: props.resourceGroupName ?? resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
