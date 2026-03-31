import {
  getQueueOutput,
  ManagedServiceIdentityType,
  Namespace,
  Queue,
  SkuName,
  Subscription,
  Topic,
} from '@pulumi/azure-native/servicebus/index.js'
import { ResourceOptions } from '@pulumi/pulumi'
import { CommonAzureConstruct } from '../../common/index.js'
import {
  ResolveServicebusQueueProps,
  ServiceBusNamespaceProps,
  ServiceBusQueueProps,
  ServiceBusSubscriptionProps,
  ServiceBusTopicProps,
} from './types.js'

/**
 * @classdesc Provides operations on Azure Servicebus using Pulumi
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
 *     this.ServicebusManager.createServicebusTopic('MyServicebusTopic', this, props)
 *   }
 * }
 * ```
 */
export class AzureServiceBusManager {
  /**
   * @summary Method to create a new service bus namespace
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props service bus namespace properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Service Bus Namespace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/service bus/namespace/}
   */
  public createServiceBusNamespace(
    id: string,
    scope: CommonAzureConstruct,
    props: ServiceBusNamespaceProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    // Get resource group name
    const resourceGroupName = scope.props.resourceGroupName
      ? scope.resourceNameFormatter.format(scope.props.resourceGroupName)
      : props.resourceGroupName

    if (!resourceGroupName) throw `Resource group name undefined for ${id}`

    return new Namespace(
      `${id}-sn`,
      {
        ...props,
        namespaceName: scope.resourceNameFormatter.format(
          props.namespaceName?.toString(),
          scope.props.resourceNameOptions?.serviceBusNamespace
        ),
        resourceGroupName: resourceGroupName,
        location: props.location ?? scope.props.location,
        identity: props.identity ?? {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        sku: props.sku ?? {
          name: SkuName.Standard,
        },
        tags: props.tags ?? {
          environment: scope.props.stage,
        },
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new service bus topic
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props service bus topic properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Service Bus Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/service bus/topic/}
   */
  public createServiceBusTopic(
    id: string,
    scope: CommonAzureConstruct,
    props: ServiceBusTopicProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new Topic(
      `${id}-st`,
      {
        ...props,
        topicName: scope.resourceNameFormatter.format(
          props.topicName?.toString(),
          scope.props.resourceNameOptions?.serviceBusTopic
        ),
        namespaceName: props.namespaceName,
        resourceGroupName: props.resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new service bus queue
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props service bus queue properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Service Bus Queue]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/service bus/queue/}
   */
  public createServiceBusQueue(
    id: string,
    scope: CommonAzureConstruct,
    props: ServiceBusQueueProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new Queue(
      `${id}-sq`,
      {
        ...props,
        queueName: scope.resourceNameFormatter.format(
          props.queueName?.toString(),
          scope.props.resourceNameOptions?.serviceBusQueue
        ),
        namespaceName: props.namespaceName,
        resourceGroupName: props.resourceGroupName,
        duplicateDetectionHistoryTimeWindow: props.duplicateDetectionHistoryTimeWindow ?? 'PT1M',
        requiresDuplicateDetection: props.requiresDuplicateDetection ?? true,
        deadLetteringOnMessageExpiration: props.deadLetteringOnMessageExpiration ?? true,
        defaultMessageTimeToLive: (props as any).defaultMessageTtl ?? 'P2D',
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new service bus subscription
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props service bus subscription properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Service Bus Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/service bus/subscription/}
   */
  public createServiceBusSubscription(
    id: string,
    scope: CommonAzureConstruct,
    props: ServiceBusSubscriptionProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return new Subscription(
      `${id}-ss`,
      {
        ...props,
        subscriptionName: scope.resourceNameFormatter.format(
          props.subscriptionName?.toString(),
          scope.props.resourceNameOptions?.serviceBusSubscription
        ),
        maxDeliveryCount: props.maxDeliveryCount ?? 1,
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to resolve an existing service bus queue
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props service bus queue properties for lookup
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Service Bus Queue Lookup]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/service bus/queue/}
   */
  public resolveServiceBusQueue(
    id: string,
    scope: CommonAzureConstruct,
    props: ResolveServicebusQueueProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw `Props undefined for ${id}`

    return getQueueOutput(
      {
        queueName: scope.resourceNameFormatter.format(
          props.queueName?.toString(),
          scope.props.resourceNameOptions?.serviceBusQueue
        ),
        namespaceName: props.namespaceName,
        resourceGroupName: props.resourceGroupName,
      },
      { parent: scope, ...resourceOptions }
    )
  }
}
