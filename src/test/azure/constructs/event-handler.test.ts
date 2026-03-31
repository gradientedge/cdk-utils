import { Topic } from '@pulumi/azure-native/eventgrid/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  AzureEventHandler,
  AzureEventHandlerProps,
  AzureLocation,
  CommonAzureStack,
  CommonAzureStackProps,
  EventHandlerEventGridSubscription,
  EventHandlerEventGridSubscriptionProps,
  EventHandlerEventGridTopicProps,
  EventHandlerServiceBus,
  EventHandlerServiceBusProps,
  EventgridEventSubscriptionProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  eventGridTopic: EventHandlerEventGridTopicProps
  eventGridEventSubscription: EventgridEventSubscriptionProps
  eventGridSubscription: EventHandlerEventGridSubscriptionProps
  serviceBus: EventHandlerServiceBusProps
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/config/dummy.json', 'src/test/azure/common/config/event-handler.json'],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestEventHandlerConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestEventHandlerConstruct(
      props.name,
      this.props as unknown as AzureEventHandlerProps & TestAzureStackProps
    )
  }
}

class TestEventHandlerConstruct extends AzureEventHandler {
  declare props: AzureEventHandlerProps & TestAzureStackProps

  constructor(name: string, props: AzureEventHandlerProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.eventGridEventSubscription = {} as EventHandlerEventGridSubscription
    this.serviceBus = {} as EventHandlerServiceBus
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.createEventGridSubscriptionDlqStorageAccount()
    this.createEventGridSubscriptionDlqStorageContainer()
    this.createServiceBusNamespace()
    this.createServiceBusQueue()
    this.createEventGrid()
    this.createEventGridEventSubscription()
    this.createServiceBusDiagnosticLog()
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath ?? '',
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:storage:StorageAccount') {
      name = args.inputs.accountName
    } else if (args.type === 'azure-native:storage:BlobContainer') {
      name = args.inputs.containerName
    } else if (args.type === 'azure-native:servicebus:Namespace') {
      name = args.inputs.namespaceName
    } else if (args.type === 'azure-native:servicebus:Queue') {
      name = args.inputs.queueName
    } else if (args.type === 'azure-native:eventgrid:Topic') {
      name = args.inputs.topicName
    } else if (args.type === 'azure-native:eventgrid:EventSubscription') {
      name = args.inputs.eventSubscriptionName
    } else if (args.type === 'azure-native:monitor:DiagnosticSetting') {
      name = args.inputs.name
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'azure-native:servicebus:listNamespaceKeys') {
      return {
        primaryConnectionString: 'mock-servicebus-connection-string',
        secondaryConnectionString: 'mock-servicebus-secondary-connection-string',
      }
    }
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureEventHandlerConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureEventHandlerConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.eventGridEventSubscription).toBeDefined()
    expect(stack.construct.eventGridTopic).toBeDefined()
    expect(stack.construct.serviceBus).toBeDefined()
  })
})

describe('TestAzureEventHandlerConstruct', () => {
  test('provisions dlq storage account as expected', () => {
    pulumi
      .all([
        stack.construct.eventGridEventSubscription.dlqStorageAccount.id,
        stack.construct.eventGridEventSubscription.dlqStorageAccount.urn,
        stack.construct.eventGridEventSubscription.dlqStorageAccount.name,
        stack.construct.eventGridEventSubscription.dlqStorageAccount.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-eventgrid-subscription-dlq-storage-account-sa-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:StorageAccount::test-common-stack-eventgrid-subscription-dlq-storage-account-sa'
        )
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureEventHandlerConstruct', () => {
  test('provisions dlq storage container as expected', () => {
    pulumi
      .all([
        stack.construct.eventGridEventSubscription.dlqStorageContainer.id,
        stack.construct.eventGridEventSubscription.dlqStorageContainer.urn,
        stack.construct.eventGridEventSubscription.dlqStorageContainer.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-eventgrid-subscription-dlq-container-sc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:BlobContainer::test-common-stack-eventgrid-subscription-dlq-container-sc'
        )
        expect(name).toBeDefined()
      })
  })
})

describe('TestAzureEventHandlerConstruct', () => {
  test('provisions service bus namespace as expected', () => {
    pulumi
      .all([
        stack.construct.serviceBus.namespace.id,
        stack.construct.serviceBus.namespace.urn,
        stack.construct.serviceBus.namespace.name,
        stack.construct.serviceBus.namespace.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-sn-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:servicebus:Namespace::test-common-stack-sn'
        )
        expect(name).toEqual('test-event-handler-sb-ns-dev')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureEventHandlerConstruct', () => {
  test('provisions service bus queue as expected', () => {
    pulumi
      .all([
        stack.construct.serviceBus.queue.id,
        stack.construct.serviceBus.queue.urn,
        stack.construct.serviceBus.queue.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-sq-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:servicebus:Queue::test-common-stack-sq'
        )
        expect(name).toEqual('test-event-handler-sb-queue-dev')
      })
  })
})

describe('TestAzureEventHandlerConstruct', () => {
  test('provisions event grid topic as expected', () => {
    const topic = stack.construct.eventGridTopic as Topic
    pulumi
      .all([topic.id, topic.urn, topic.name, topic.location, topic.tags])
      .apply(([id, urn, name, location, tags]) => {
        expect(id).toEqual('test-common-stack-et-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:eventgrid:Topic::test-common-stack-et'
        )
        expect(name).toEqual('test-event-handler-topic-dev')
        expect(location).toEqual('eastus')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureEventHandlerConstruct', () => {
  test('provisions event grid event subscription as expected', () => {
    pulumi
      .all([
        stack.construct.eventGridEventSubscription.eventSubscription.id,
        stack.construct.eventGridEventSubscription.eventSubscription.urn,
        stack.construct.eventGridEventSubscription.eventSubscription.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-es-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:eventgrid:EventSubscription::test-common-stack-es'
        )
        expect(name).toEqual('test-event-handler-subscription-dev')
      })
  })
})
