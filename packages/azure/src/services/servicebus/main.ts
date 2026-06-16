import { Deployment, DeploymentMode } from '@pulumi/azure-native/resources/index.js'
import {
  getQueueOutput,
  ManagedServiceIdentityType,
  Namespace,
  Queue,
  QueueAuthorizationRule,
  SkuName,
  Subscription,
  Topic,
} from '@pulumi/azure-native/servicebus/index.js'
import { servicebus as servicebusInputs } from '@pulumi/azure-native/types/input.js'
import { all, Input, output, ResourceOptions } from '@pulumi/pulumi'

import { CommonAzureConstruct } from '../../common/index.js'

import {
  ResolveServicebusQueueProps,
  ServiceBusGeoReplicationProps,
  ServiceBusNamespaceProps,
  ServiceBusQueueAuthorizationRuleProps,
  ServiceBusQueueProps,
  ServiceBusSubscriptionProps,
  ServiceBusTopicProps,
} from './types.js'

/**
 * Provides operations on Azure Servicebus using Pulumi
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
 * @category Service
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
    if (!props) throw new Error(`Props undefined for ${id}`)

    const { enableGeoReplication, geoReplication, ...namespaceProps } = props

    if (enableGeoReplication && !geoReplication) {
      throw new Error(`enableGeoReplication is true but geoReplication config is missing for ${id}`)
    }

    // Get resource group name
    const resourceGroupName =
      namespaceProps.resourceGroupName ?? scope.resourceNameFormatter.format(scope.props.resourceGroupName)

    const sku = namespaceProps.sku ?? { name: SkuName.Standard }

    if (enableGeoReplication) {
      // Geo-replication requires Premium. Callers pass `sku` as a literal SBSkuArgs in
      // practice; validate synchronously so misconfiguration fails at construct time
      // rather than during preview/up.
      const skuName = (sku as servicebusInputs.SBSkuArgs).name
      if (skuName !== SkuName.Premium) {
        throw new Error(
          `Service Bus geo-replication requires the Premium SKU, but ${id} was configured with "${String(skuName)}"`
        )
      }
    }

    const namespace = new Namespace(
      `${id}-sn`,
      {
        ...namespaceProps,
        namespaceName: scope.resourceNameFormatter.format(
          namespaceProps.namespaceName?.toString(),
          scope.props.resourceNameOptions?.serviceBusNamespace
        ),
        resourceGroupName,
        location: namespaceProps.location ?? scope.props.location,
        identity: namespaceProps.identity ?? {
          type: ManagedServiceIdentityType.SystemAssigned,
        },
        sku,
        tags: {
          environment: scope.props.stage,
          ...scope.props.defaultTags,
          ...namespaceProps.tags,
        },
      },
      { parent: scope, ...resourceOptions }
    )

    if (enableGeoReplication && geoReplication) {
      this.createServiceBusGeoReplicationDeployment(
        id,
        scope,
        namespace,
        resourceGroupName,
        sku,
        geoReplication,
        resourceOptions
      )
    }

    return namespace
  }

  /**
   * Provisions the geo-replication topology for a Service Bus namespace via an ARM
   * deployment. The deployment PATCHes the existing namespace using the 2024-01-01
   * Service Bus API version, which exposes the `geoDataReplication` property that is
   * not yet surfaced by `@pulumi/azure-native`'s strongly-typed `Namespace` resource.
   */
  private createServiceBusGeoReplicationDeployment(
    id: string,
    scope: CommonAzureConstruct,
    namespace: Namespace,
    resourceGroupName: Input<string>,
    sku: Input<servicebusInputs.SBSkuArgs>,
    geoReplication: ServiceBusGeoReplicationProps,
    resourceOptions?: ResourceOptions
  ) {
    const template = all([
      namespace.name,
      namespace.location,
      output(sku),
      output(geoReplication.maxReplicationLagDurationInSeconds ?? 0),
      output(geoReplication.locations),
    ]).apply(([namespaceName, location, resolvedSku, maxLagSeconds, locations]) => ({
      $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
      contentVersion: '1.0.0.0',
      resources: [
        {
          type: 'Microsoft.ServiceBus/namespaces',
          apiVersion: '2024-01-01',
          name: namespaceName,
          location,
          sku: {
            name: resolvedSku.name,
            tier: resolvedSku.tier ?? resolvedSku.name,
            capacity: resolvedSku.capacity ?? 1,
          },
          properties: {
            geoDataReplication: {
              maxReplicationLagDurationInSeconds: maxLagSeconds,
              locations: locations.map(location => ({
                locationName: location.locationName,
                roleType: location.roleType,
              })),
            },
          },
        },
      ],
    }))

    return new Deployment(
      `${id}-sn-geo`,
      {
        resourceGroupName,
        deploymentName: scope.resourceNameFormatter.format(`${id}-sn-geo`),
        properties: {
          mode: DeploymentMode.Incremental,
          template,
        },
      },
      { ...resourceOptions, parent: namespace, dependsOn: [namespace] }
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
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new Topic(
      `${id}-st`,
      {
        ...props,
        topicName: scope.resourceNameFormatter.format(
          props.topicName?.toString(),
          scope.props.resourceNameOptions?.serviceBusTopic
        ),
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
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new Queue(
      `${id}-sq`,
      {
        ...props,
        queueName: scope.resourceNameFormatter.format(
          props.queueName?.toString(),
          scope.props.resourceNameOptions?.serviceBusQueue
        ),
        duplicateDetectionHistoryTimeWindow: props.duplicateDetectionHistoryTimeWindow ?? 'PT1M',
        requiresDuplicateDetection: props.requiresDuplicateDetection ?? true,
        deadLetteringOnMessageExpiration: props.deadLetteringOnMessageExpiration ?? true,
        defaultMessageTimeToLive: props.defaultMessageTimeToLive ?? 'P14D',
        requiresSession: props.requiresSession ?? false,
        enablePartitioning: props.enablePartitioning ?? false,
      },
      { parent: scope, ...resourceOptions }
    )
  }

  /**
   * @summary Method to create a new service bus queue authorization rule
   * @param id scoped id of the resource
   * @param scope scope in which this resource is defined
   * @param props service bus queue authorization rule properties
   * @param resourceOptions Optional settings to control resource behaviour
   * @see [Pulumi Azure Native Service Bus Queue Authorization Rule]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/queueauthorizationrule/}
   */
  public createServiceBusQueueAuthorizationRule(
    id: string,
    scope: CommonAzureConstruct,
    props: ServiceBusQueueAuthorizationRuleProps,
    resourceOptions?: ResourceOptions
  ) {
    if (!props) throw new Error(`Props undefined for ${id}`)

    return new QueueAuthorizationRule(`${id}-sqar`, { ...props }, { parent: scope, ...resourceOptions })
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
    if (!props) throw new Error(`Props undefined for ${id}`)

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
    if (!props) throw new Error(`Props undefined for ${id}`)

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
