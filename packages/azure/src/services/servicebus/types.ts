import {
  GetQueueOutputArgs,
  NamespaceArgs,
  QueueArgs,
  QueueAuthorizationRuleArgs,
  SubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/servicebus/index.js'
import { Input } from '@pulumi/pulumi'

/**
 * Role of a replica within a Service Bus geo-replication topology. Mirrors the
 * `roleType` values accepted by the Service Bus ARM API. Declared locally because
 * `@pulumi/azure-native` does not yet surface a strongly-typed enum for this field;
 * swap to the upstream enum once it ships.
 * @category Enum
 */
export const ServiceBusGeoReplicationRoleType = {
  Primary: 'Primary',
  Secondary: 'Secondary',
} as const
export type ServiceBusGeoReplicationRoleType =
  (typeof ServiceBusGeoReplicationRoleType)[keyof typeof ServiceBusGeoReplicationRoleType]

/**
 * Geo-replication replica configuration for a Service Bus namespace.
 * @category Interface
 */
export interface ServiceBusGeoReplicationLocation {
  /** Azure region name (e.g. "westeurope"). */
  locationName: Input<string>
  /** Replica role — exactly one entry must be `Primary`, the rest `Secondary`. */
  roleType: Input<ServiceBusGeoReplicationRoleType>
}

/**
 * Geo-replication configuration for a Service Bus namespace.
 * Provisioned via an ARM deployment using the 2024-01-01 Service Bus API version,
 * which is the first stable version that exposes the `geoDataReplication` block.
 * @category Interface
 */
export interface ServiceBusGeoReplicationProps {
  /**
   * Replication lag tolerance in seconds. `0` means synchronous replication.
   * Async values typically sit in the 60–1440 range.
   */
  maxReplicationLagDurationInSeconds?: Input<number>
  /** Primary + one or more secondary regions. */
  locations: Input<Input<ServiceBusGeoReplicationLocation>[]>
}

/**
 * Properties for creating a Service Bus namespace
 * @see [Pulumi Azure Native Service Bus Namespace]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/namespace/}
 * @category Interface
 */
export interface ServiceBusNamespaceProps extends NamespaceArgs {
  /**
   * Enables Service Bus geo-replication. Requires the namespace SKU to be `Premium`.
   * When `true`, {@link geoReplication} must be supplied.
   */
  enableGeoReplication?: boolean
  /** Geo-replication topology. Only consumed when {@link enableGeoReplication} is `true`. */
  geoReplication?: ServiceBusGeoReplicationProps
}

/**
 * Properties for creating a Service Bus topic
 * @see [Pulumi Azure Native Service Bus Topic]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/topic/}
 * @category Interface
 */
export interface ServiceBusTopicProps extends TopicArgs {}

/**
 * Properties for creating a Service Bus queue
 * @see [Pulumi Azure Native Service Bus Queue]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/queue/}
 * @category Interface
 */
export interface ServiceBusQueueProps extends QueueArgs {}

/**
 * Properties for creating a Service Bus queue authorization rule
 * @see [Pulumi Azure Native Service Bus Queue Authorization Rule]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/queueauthorizationrule/}
 * @category Interface
 */
export interface ServiceBusQueueAuthorizationRuleProps extends QueueAuthorizationRuleArgs {}

/**
 * Properties for creating a Service Bus subscription
 * @see [Pulumi Azure Native Service Bus Subscription]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/subscription/}
 * @category Interface
 */
export interface ServiceBusSubscriptionProps extends SubscriptionArgs {}

/**
 * Properties for resolving an existing Service Bus queue
 * @see [Pulumi Azure Native Service Bus Queue]{@link https://www.pulumi.com/registry/packages/azure-native/api-docs/servicebus/queue/}
 * @category Interface
 */
export interface ResolveServicebusQueueProps extends GetQueueOutputArgs {}
