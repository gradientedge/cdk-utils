import {
  EventSubscriptionArgs,
  GetTopicOutputArgs,
  SystemTopicArgs,
  SystemTopicEventSubscriptionArgs,
  TopicArgs,
} from '@pulumi/azure-native/eventgrid/index.js'

export interface EventgridTopicProps extends TopicArgs {}

export interface EventgridEventSubscriptionProps extends EventSubscriptionArgs {}

export interface EventgridSystemTopicProps extends SystemTopicArgs {}

export interface EventgridSystemTopicEventSubscriptionProps extends SystemTopicEventSubscriptionArgs {}

export interface ResolveEventgridTopicProps extends GetTopicOutputArgs {}
