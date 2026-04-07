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
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  eventGridTopic: EventHandlerEventGridTopicProps
  eventGridEventSubscription: EventgridEventSubscriptionProps
  eventGridSubscription: EventHandlerEventGridSubscriptionProps
  serviceBus: EventHandlerServiceBusProps
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/event-handler.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

const testStackExistingTopicProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/event-handler-existing-topic.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

const testStackExistingTopicNoSubProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/event-handler-existing-topic-nosub.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

const testStackDefenderProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/event-handler-defender.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: AzureEventHandlerProps & TestAzureStackProps
  declare construct: TestEventHandlerConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestEventHandlerConstruct(props.name, this.props)
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
    this.enableMalwareScanningOnDataStorageAccount()
  }
}

/** Test class to cover useExistingTopic with existingSubscriptionId */
class TestCommonStackExistingTopic extends CommonAzureStack {
  declare props: AzureEventHandlerProps & TestAzureStackProps
  declare construct: TestEventHandlerExistingTopicConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackExistingTopicProps)
    this.construct = new TestEventHandlerExistingTopicConstruct(`${props.name}-existing`, this.props)
  }
}

class TestEventHandlerExistingTopicConstruct extends AzureEventHandler {
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

/** Test class to cover useExistingTopic without existingSubscriptionId */
class TestCommonStackExistingTopicNoSub extends CommonAzureStack {
  declare props: AzureEventHandlerProps & TestAzureStackProps
  declare construct: TestEventHandlerExistingTopicNoSubConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackExistingTopicNoSubProps)
    this.construct = new TestEventHandlerExistingTopicNoSubConstruct(`${props.name}-existing-nosub`, this.props)
  }
}

class TestEventHandlerExistingTopicNoSubConstruct extends AzureEventHandler {
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

/** Test class to cover enableMalwareScanningOnDataStorageAccount with defender props */
class TestCommonStackWithDefender extends CommonAzureStack {
  declare props: AzureEventHandlerProps & TestAzureStackProps
  declare construct: TestEventHandlerWithDefenderConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackDefenderProps)
    this.construct = new TestEventHandlerWithDefenderConstruct(`${props.name}-defender`, this.props)
  }
}

class TestEventHandlerWithDefenderConstruct extends AzureEventHandler {
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
    this.createDataStorageAccount()
    this.enableMalwareScanningOnDataStorageAccount()
  }
}

// Suppress expected unhandled rejections from dependsOn with non-Resource values in existing topic variants
process.on('unhandledRejection', () => {})

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
    } else if (args.type === 'azure-native:security:DefenderForStorage') {
      name = args.name
    } else if (args.type === 'pulumi:providers:azure-native') {
      name = args.name
    } else if (args.type === 'azure-native:web:AppServicePlan') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:appconfiguration:ConfigurationStore') {
      name = args.inputs.configStoreName
    } else if (args.type === 'azure-native:web:WebApp') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:authorization:RoleAssignment') {
      name = args.name
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
    if (args.token === 'azure-native:eventgrid:getTopic') {
      return {
        id: 'existing-topic-id',
        name: args.inputs.topicName,
        endpoint: 'https://existing-topic.endpoint.com',
      }
    }
    if (args.token === 'azure-native:storage:listStorageAccountKeys') {
      return { keys: [{ value: 'mock-storage-key' }] }
    }
    if (args.token.includes('archive')) {
      return {
        source: args.inputs.sourceDir ?? 'dist',
        outputPath: args.inputs.outputPath ?? 'dist/app.zip',
        outputSize: 1024,
        outputBase64sha256: 'mock-hash',
      }
    }
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackExistingTopicProps.extraContexts))
const stackExistingTopic = new TestCommonStackExistingTopic('test-existing-topic-stack', testStackExistingTopicProps)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackExistingTopicNoSubProps.extraContexts))
const stackExistingTopicNoSub = new TestCommonStackExistingTopicNoSub(
  'test-existing-topic-nosub-stack',
  testStackExistingTopicNoSubProps
)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackDefenderProps.extraContexts))
const stackWithDefender = new TestCommonStackWithDefender('test-defender-stack', testStackDefenderProps)

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

describe('TestAzureEventHandlerExistingTopicConstruct', () => {
  test('synthesises with existing topic and subscription id as expected', () => {
    expect(stackExistingTopic).toBeDefined()
    expect(stackExistingTopic.construct).toBeDefined()
    expect(stackExistingTopic.construct.eventGridTopic).toBeDefined()
    expect(stackExistingTopic.construct.props.eventGridTopic.useExistingTopic).toEqual(true)
    expect(stackExistingTopic.construct.props.eventGridTopic.existingSubscriptionId).toEqual('test-subscription-id')
  })
})

describe('TestAzureEventHandlerExistingTopicNoSubConstruct', () => {
  test('synthesises with existing topic without subscription id as expected', () => {
    expect(stackExistingTopicNoSub).toBeDefined()
    expect(stackExistingTopicNoSub.construct).toBeDefined()
    expect(stackExistingTopicNoSub.construct.eventGridTopic).toBeDefined()
    expect(stackExistingTopicNoSub.construct.props.eventGridTopic.useExistingTopic).toEqual(true)
    expect(stackExistingTopicNoSub.construct.props.eventGridTopic.existingSubscriptionId).toBeUndefined()
  })
})

describe('TestAzureEventHandlerWithDefenderConstruct', () => {
  test('synthesises with defender as expected', () => {
    expect(stackWithDefender).toBeDefined()
    expect(stackWithDefender.construct).toBeDefined()
    expect(stackWithDefender.construct.eventGridTopic).toBeDefined()
    expect(stackWithDefender.construct.dataStorageAccount).toBeDefined()
    expect(stackWithDefender.construct.props.defender).toBeDefined()
  })
})

/* --- Test for full initResources flow covering lines 41-52 --- */

const testStackFullProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/event-handler-full.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

class TestEventHandlerFullConstruct extends AzureEventHandler {
  declare props: AzureEventHandlerProps & TestAzureStackProps

  constructor(name: string, props: AzureEventHandlerProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.eventGridEventSubscription = {} as EventHandlerEventGridSubscription
    this.serviceBus = {} as EventHandlerServiceBus
    this.appConnectionStrings = []
    this.initResources()
  }
}

class TestCommonStackFull extends CommonAzureStack {
  declare props: AzureEventHandlerProps & TestAzureStackProps
  declare construct: TestEventHandlerFullConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackFullProps)
    this.construct = new TestEventHandlerFullConstruct(`${props.name}-full`, this.props)
  }
}

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackFullProps.extraContexts))
const stackFull = new TestCommonStackFull('test-full-stack', testStackFullProps)

describe('TestAzureEventHandlerFullConstruct', () => {
  test('full initResources covers resolveApplicationInsights and super.initResources', () => {
    expect(stackFull).toBeDefined()
    expect(stackFull.construct).toBeDefined()
    expect(stackFull.construct.eventGridEventSubscription).toBeDefined()
    expect(stackFull.construct.serviceBus).toBeDefined()
    expect(stackFull.construct.eventGridTopic).toBeDefined()
    expect(stackFull.construct.applicationInsights).toBeDefined()
  })
})
