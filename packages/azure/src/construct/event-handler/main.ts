import { Provider } from '@pulumi/azure-native'
import { getTopicOutput, GetTopicResult, Topic } from '@pulumi/azure-native/eventgrid/index.js'
import { Resource } from '@pulumi/azure-native/resources/index.js'
import { getNamespaceOutput, getQueueOutput, listNamespaceKeysOutput } from '@pulumi/azure-native/servicebus/index.js'
import { Output } from '@pulumi/pulumi'

import { AzureFunctionApp } from '../function-app/index.js'

import { AzureEventHandlerProps, EventHandlerEventGridSubscription, EventHandlerServiceBus } from './types.js'

/**
 * Provides a construct to create and deploy an Azure EventGrid Event Handler with Service Bus integration
 * @example
 * import { AzureEventHandler, AzureEventHandlerProps } from '@gradientedge/cdk-utils'
 *
 * class CustomConstruct extends AzureEventHandler {
 *   constructor(id: string, props: AzureEventHandlerProps) {
 *     super(id, props)
 *     this.props = props
 *     this.id = id
 *     this.initResources()
 *   }
 * }
 * @category Construct
 */
export class AzureEventHandler extends AzureFunctionApp {
  props: AzureEventHandlerProps
  eventGridEventSubscription: EventHandlerEventGridSubscription
  eventGridTopic: Topic | Output<GetTopicResult>
  serviceBus: EventHandlerServiceBus

  constructor(id: string, props: AzureEventHandlerProps) {
    super(id, props)
    this.props = props
    this.id = id
  }

  /**
   * @summary Initialise and provision resources
   */
  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createEventGridSubscriptionDlqStorageAccount()
    this.createEventGridSubscriptionDlqStorageContainer()
    this.createServiceBusNamespace()
    this.createServiceBusQueue()
    this.createEventGrid()
    this.createEventGridEventSubscription()
    this.createServiceBusDiagnosticLog()
    this.enableMalwareScanningOnDataStorageAccount()
    super.initResources()
  }

  /**
   * @summary Method to create the dead-letter queue storage account for EventGrid subscriptions
   */
  protected createEventGridSubscriptionDlqStorageAccount() {
    if (this.props.serviceBus.useExisting) return

    this.eventGridEventSubscription.dlqStorageAccount = this.storageManager.createStorageAccount(
      `${this.id}-eventgrid-subscription-dlq-storage-account`,
      this,
      {
        ...this.props.eventGridSubscription.dlqStorageAccount,
        resourceGroupName: this.resourceGroup.name,
        location: this.resourceGroup.location,
      }
    )
  }

  /**
   * @summary Method to create the dead-letter queue storage container for EventGrid subscriptions
   */
  protected createEventGridSubscriptionDlqStorageContainer() {
    if (this.props.serviceBus.useExisting) return

    this.eventGridEventSubscription.dlqStorageContainer = this.storageManager.createStorageContainer(
      `${this.id}-eventgrid-subscription-dlq-container`,
      this,
      {
        ...this.props.eventGridSubscription.dlqStorageContainer,
        accountName: this.eventGridEventSubscription.dlqStorageAccount!.name,
        containerName: 'eventgrid-subscription-dlq-container',
        resourceGroupName: this.resourceGroup.name,
      }
    )
  }

  /**
   * @summary Method to create the Service Bus namespace
   */
  protected createServiceBusNamespace() {
    if (this.props.serviceBus.useExisting && this.props.serviceBus.namespace.namespaceName) {
      this.serviceBus.namespace = getNamespaceOutput({
        namespaceName: this.props.serviceBus.namespace.namespaceName,
        resourceGroupName: this.props.serviceBus.namespace.resourceGroupName,
      })
    } else {
      this.serviceBus.namespace = this.serviceBusManager.createServiceBusNamespace(
        this.id,
        this,
        {
          ...this.props.serviceBus.namespace,
          namespaceName: this.props.serviceBus.namespace.namespaceName ?? this.id,
          resourceGroupName: this.resourceGroup.name,
        },
        { ignoreChanges: ['location'] }
      )
    }

    this.registerOutputs({
      serviceBusNamespaceId: this.serviceBus.namespace.id,
    })
  }

  /**
   * @summary Method to create the Service Bus queue
   */
  protected createServiceBusQueue() {
    if (
      this.props.serviceBus.useExisting &&
      this.props.serviceBus.namespace.namespaceName &&
      this.props.serviceBus.queue.queueName
    ) {
      this.serviceBus.queue = getQueueOutput({
        namespaceName: this.props.serviceBus.namespace.namespaceName,
        queueName: this.props.serviceBus.queue.queueName,
        resourceGroupName: this.props.serviceBus.namespace.resourceGroupName,
      })
    } else {
      this.serviceBus.queue = this.serviceBusManager.createServiceBusQueue(this.id, this, {
        ...this.props.serviceBus.queue,
        queueName: this.props.serviceBus.queue.queueName ?? this.id,
        namespaceName: this.serviceBus.namespace.name,
      })
    }

    this.registerOutputs({
      serviceBusQueueId: this.serviceBus.queue.id,
      serviceBusQueueName: this.serviceBus.queue.name,
    })
  }

  /**
   * @summary Method to create or resolve an existing EventGrid topic
   */
  protected createEventGrid() {
    if (!this.props.eventGridTopic.useExistingTopic) {
      this.eventGridTopic = this.eventgridManager.createEventgridTopic(
        this.id,
        this,
        {
          ...this.props.eventGridTopic,
          topicName: this.props.eventGridTopic.topicName ?? this.id,
          location: this.resourceGroup.location,
          resourceGroupName: this.resourceGroup.name,
        },
        { protect: true, ignoreChanges: ['location'] }
      )
      return
    }

    const existingSubscriptionId = this.props.eventGridTopic.existingSubscriptionId
    const existingTopicName = this.props.eventGridTopic.existingTopicName
    const existingResourceGroupName = this.props.eventGridTopic.existingResourceGroupName

    let provider: Provider | undefined
    if (existingSubscriptionId) {
      provider = new Provider(`${this.id}-${existingSubscriptionId}`, {
        subscriptionId: existingSubscriptionId,
      })
    }
    if (existingResourceGroupName && existingTopicName) {
      this.eventGridTopic = getTopicOutput(
        {
          topicName: existingTopicName,
          resourceGroupName: existingResourceGroupName,
        },
        { provider }
      )
    }
  }

  /**
   * @summary Method to create the EventGrid event subscription with Service Bus queue destination
   */
  protected createEventGridEventSubscription() {
    if (this.props.serviceBus.useExisting) return

    this.eventGridEventSubscription.eventSubscription = this.eventgridManager.createEventgridSubscription(
      this.id,
      this,
      {
        ...this.props.eventGridEventSubscription,
        eventSubscriptionName: this.props.eventGridEventSubscription.eventSubscriptionName ?? this.id,
        scope: this.eventGridTopic.id,
        destination: {
          endpointType: 'ServiceBusQueue',
          resourceId: this.serviceBus.queue.id,
        },
        deadLetterDestination: {
          blobContainerName: this.eventGridEventSubscription.dlqStorageContainer!.name,
          endpointType: 'StorageBlob',
          resourceId: this.eventGridEventSubscription.dlqStorageAccount!.id,
        },
      },
      { dependsOn: [this.eventGridTopic as unknown as Resource] }
    )
  }

  /**
   * @summary Method to create diagnostic log settings for the Service Bus namespace
   */
  protected createServiceBusDiagnosticLog() {
    if (this.props.serviceBus.useExisting) return

    this.monitorManager.createMonitorDiagnosticSettings(this.id, this, {
      name: `${this.id}-servicebus`,
      resourceUri: this.serviceBus.namespace.id,
      workspaceId: this.commonLogAnalyticsWorkspace.id,
      logAnalyticsDestinationType: 'Dedicated',
      logs: [
        {
          categoryGroup: 'allLogs',
          enabled: true,
        },
      ],
      metrics: [
        {
          category: 'AllMetrics',
          enabled: true,
        },
      ],
    })
  }

  /**
   * @summary Method to enable Microsoft Defender malware scanning on the data storage account
   */
  protected enableMalwareScanningOnDataStorageAccount() {
    if (!this.props.defender) return

    this.securityCentermanager.createDefenderForStorage(`${this.id}-data-storage-defender`, this, {
      ...this.props.defender,
      resourceId: this.dataStorageAccount.id,
      properties: {
        malwareScanning: {
          scanResultsEventGridTopicResourceId: this.eventGridTopic.id,
        },
      },
    })
  }

  protected createFunctionAppSiteConfig() {
    super.createFunctionAppSiteConfig()

    this.appEnvironmentVariables = {
      ...this.appEnvironmentVariables,
      EVENT_INGEST_QUEUE_NAME: this.serviceBus.queue.name,
    }

    this.appConnectionStrings = [
      {
        name: 'EVENT_INGEST_SERVICE_BUS',
        value: listNamespaceKeysOutput({
          resourceGroupName: this.props.serviceBus.namespace.resourceGroupName,
          namespaceName: this.serviceBus.namespace.name,
          authorizationRuleName: 'RootManageSharedAccessKey',
        }).primaryConnectionString,
        type: 'ServiceBus',
      },
    ]
  }

  protected dashboardVariables(): Record<string, any> {
    const variables = super.dashboardVariables()
    return {
      ...variables,
      servicebusNamespaceName: this.serviceBus.namespace.name,
      eventHandlerEventgridTopic: this.eventGridTopic.name,
      eventGridEventSubscriptionName: this.eventGridEventSubscription.eventSubscription?.name,
    }
  }
}
