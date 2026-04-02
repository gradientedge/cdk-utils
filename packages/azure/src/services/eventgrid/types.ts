import {
  EventSubscriptionArgs,
  GetTopicOutputArgs,
  SystemTopicArgs,
  SystemTopicEventSubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/eventgrid/index.js'

/** @category Interface */
export interface EventgridTopicProps extends TopicArgs {}

/** @category Interface */
export interface EventgridEventSubscriptionProps extends EventSubscriptionArgs {}

/** @category Interface */
export interface EventgridSystemTopicProps extends SystemTopicArgs {}

/** @category Interface */
export interface EventgridSystemTopicEventSubscriptionProps extends SystemTopicEventSubscriptionArgs {}

/** @category Interface */
export interface ResolveEventgridTopicProps extends GetTopicOutputArgs {}
