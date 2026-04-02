import { Namespace, Queue, Subscription, Topic } from '@pulumi/azure-native/servicebus/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ServiceBusNamespaceProps,
  ServiceBusQueueProps,
  ServiceBusSubscriptionProps,
  ServiceBusTopicProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testServicebusNamespace: ServiceBusNamespaceProps
  testServicebusTopic: ServiceBusTopicProps
  testServicebusQueue: ServiceBusQueueProps
  testServicebusSubscription: ServiceBusSubscriptionProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/servicebus.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestCommonConstruct(testStackProps.name, this.props)
  }

  protected determineConstructProps(props: TestAzureStackProps): TestAzureStackProps {
    const baseProps = super.determineConstructProps(props)
    // Override the test property to undefined to trigger validation error
    return { ...baseProps, testServicebusNamespace: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  serviceBusNamespace: Namespace
  serviceBusTopic: Topic
  serviceBusQueue: Queue
  serviceBusSubscription: Subscription
  resolvedServiceBusQueue: any

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.serviceBusNamespace = this.serviceBusManager.createServiceBusNamespace(
      `test-servicebus-namespace-${this.props.stage}`,
      this,
      this.props.testServicebusNamespace
    )

    this.serviceBusTopic = this.serviceBusManager.createServiceBusTopic(
      `test-servicebus-topic-${this.props.stage}`,
      this,
      this.props.testServicebusTopic
    )

    this.serviceBusQueue = this.serviceBusManager.createServiceBusQueue(
      `test-servicebus-queue-${this.props.stage}`,
      this,
      this.props.testServicebusQueue
    )

    this.serviceBusSubscription = this.serviceBusManager.createServiceBusSubscription(
      `test-servicebus-subscription-${this.props.stage}`,
      this,
      this.props.testServicebusSubscription
    )

    this.resolvedServiceBusQueue = this.serviceBusManager.resolveServiceBusQueue(
      `test-resolve-servicebus-queue-${this.props.stage}`,
      this,
      {
        queueName: 'test-servicebus-queue',
        namespaceName: 'test-servicebus-namespace-dev',
        resourceGroupName: 'test-rg-dev',
      }
    )
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:servicebus:Namespace') {
      name = args.inputs.namespaceName
    } else if (args.type === 'azure-native:servicebus:Topic') {
      name = args.inputs.topicName
    } else if (args.type === 'azure-native:servicebus:Queue') {
      name = args.inputs.queueName
    } else if (args.type === 'azure-native:servicebus:Subscription') {
      name = args.inputs.subscriptionName
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock Service Bus connection string retrieval
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

describe('TestAzureServicebusConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-servicebus-namespace-dev')
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.serviceBusNamespace).toBeDefined()
    expect(stack.construct.serviceBusTopic).toBeDefined()
    expect(stack.construct.serviceBusQueue).toBeDefined()
    expect(stack.construct.serviceBusSubscription).toBeDefined()
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus namespace as expected', () => {
    pulumi
      .all([
        stack.construct.serviceBusNamespace.id,
        stack.construct.serviceBusNamespace.urn,
        stack.construct.serviceBusNamespace.name,
        stack.construct.serviceBusNamespace.location,
        stack.construct.serviceBusNamespace.sku,
        stack.construct.serviceBusNamespace.identity,
        stack.construct.serviceBusNamespace.tags,
      ])
      .apply(([id, urn, name, location, sku, identity, tags]) => {
        expect(id).toEqual('test-servicebus-namespace-dev-sn-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:servicebus:Namespace::test-servicebus-namespace-dev-sn'
        )
        expect(name).toEqual('test-servicebus-namespace-dev')
        expect(location).toEqual('eastus')
        expect(sku).toEqual({ name: 'Standard' })
        expect(identity).toEqual({ type: 'SystemAssigned' })
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus topic as expected', () => {
    pulumi
      .all([
        stack.construct.serviceBusTopic.id,
        stack.construct.serviceBusTopic.urn,
        stack.construct.serviceBusTopic.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-servicebus-topic-dev-st-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:servicebus:Topic::test-servicebus-topic-dev-st'
        )
        expect(name).toEqual('test-servicebus-topic-dev')
      })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus queue as expected', () => {
    pulumi
      .all([
        stack.construct.serviceBusQueue.id,
        stack.construct.serviceBusQueue.urn,
        stack.construct.serviceBusQueue.name,
        stack.construct.serviceBusQueue.requiresDuplicateDetection,
        stack.construct.serviceBusQueue.deadLetteringOnMessageExpiration,
      ])
      .apply(([id, urn, name, requiresDuplicateDetection, deadLetteringOnMessageExpiration]) => {
        expect(id).toEqual('test-servicebus-queue-dev-sq-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:servicebus:Queue::test-servicebus-queue-dev-sq'
        )
        expect(name).toEqual('test-servicebus-queue-dev')
        expect(requiresDuplicateDetection).toEqual(true)
        expect(deadLetteringOnMessageExpiration).toEqual(true)
      })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus subscription as expected', () => {
    pulumi
      .all([
        stack.construct.serviceBusSubscription.id,
        stack.construct.serviceBusSubscription.urn,
        stack.construct.serviceBusSubscription.name,
        stack.construct.serviceBusSubscription.maxDeliveryCount,
      ])
      .apply(([id, urn, name, maxDeliveryCount]) => {
        expect(id).toEqual('test-servicebus-subscription-dev-ss-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:servicebus:Subscription::test-servicebus-subscription-dev-ss'
        )
        expect(name).toEqual('test-servicebus-subscription-dev')
        expect(maxDeliveryCount).toEqual(1)
      })
  })
})

/* --- Tests for error handling on topic, queue, subscription, resolve --- */

describe('TestAzureServicebusConstruct - Error Handling', () => {
  test('createServiceBusTopic throws when props are undefined', () => {
    expect(() => {
      stack.construct.serviceBusManager.createServiceBusTopic('test-topic-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-topic-err')
  })

  test('createServiceBusQueue throws when props are undefined', () => {
    expect(() => {
      stack.construct.serviceBusManager.createServiceBusQueue('test-queue-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-queue-err')
  })

  test('createServiceBusSubscription throws when props are undefined', () => {
    expect(() => {
      stack.construct.serviceBusManager.createServiceBusSubscription('test-sub-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-sub-err')
  })

  test('resolveServiceBusQueue throws when props are undefined', () => {
    expect(() => {
      stack.construct.serviceBusManager.resolveServiceBusQueue('test-resolve-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-resolve-err')
  })
})

/* --- Tests for resource group name fallback and default values --- */

class TestMinimalServiceBusConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  serviceBusNamespace: Namespace
  serviceBusTopic: Topic
  serviceBusQueue: Queue
  serviceBusSubscription: Subscription

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.serviceBusNamespace = this.serviceBusManager.createServiceBusNamespace(
      `test-minimal-sb-ns-${this.props.stage}`,
      this,
      {
        namespaceName: 'test-minimal-sb-ns',
        resourceGroupName: 'test-rg-dev',
      } as ServiceBusNamespaceProps
    )

    this.serviceBusTopic = this.serviceBusManager.createServiceBusTopic(
      `test-minimal-sb-topic-${this.props.stage}`,
      this,
      {
        topicName: 'test-minimal-sb-topic',
        namespaceName: 'test-minimal-sb-ns-dev',
        resourceGroupName: 'test-rg-dev',
      } as ServiceBusTopicProps
    )

    this.serviceBusQueue = this.serviceBusManager.createServiceBusQueue(
      `test-minimal-sb-queue-${this.props.stage}`,
      this,
      {
        queueName: 'test-minimal-sb-queue',
        namespaceName: 'test-minimal-sb-ns-dev',
        resourceGroupName: 'test-rg-dev',
      } as ServiceBusQueueProps
    )

    this.serviceBusSubscription = this.serviceBusManager.createServiceBusSubscription(
      `test-minimal-sb-sub-${this.props.stage}`,
      this,
      {
        subscriptionName: 'test-minimal-sb-sub',
        namespaceName: 'test-minimal-sb-ns-dev',
        topicName: 'test-minimal-sb-topic-dev',
        resourceGroupName: 'test-rg-dev',
      } as ServiceBusSubscriptionProps
    )
  }
}

class TestMinimalServiceBusStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalServiceBusConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalServiceBusConstruct(props.name, this.props)
  }
}

const minimalSbStack = new TestMinimalServiceBusStack('test-minimal-sb-stack', testStackProps)

describe('TestAzureServicebusConstruct - Default Values', () => {
  test('provisions namespace with default identity, sku and tags', () => {
    pulumi
      .all([
        minimalSbStack.construct.serviceBusNamespace.identity,
        minimalSbStack.construct.serviceBusNamespace.sku,
        minimalSbStack.construct.serviceBusNamespace.tags,
      ])
      .apply(([identity, sku, tags]) => {
        expect(identity?.type).toEqual('SystemAssigned')
        expect(sku?.name).toEqual('Standard')
        expect(tags?.environment).toEqual('dev')
      })
  })

  test('provisions topic as expected', () => {
    expect(minimalSbStack.construct.serviceBusTopic).toBeDefined()
  })

  test('provisions queue with default values', () => {
    pulumi
      .all([
        minimalSbStack.construct.serviceBusQueue.requiresDuplicateDetection,
        minimalSbStack.construct.serviceBusQueue.deadLetteringOnMessageExpiration,
        minimalSbStack.construct.serviceBusQueue.duplicateDetectionHistoryTimeWindow,
      ])
      .apply(([requiresDuplicateDetection, deadLetteringOnMessageExpiration, duplicateDetectionHistoryTimeWindow]) => {
        expect(requiresDuplicateDetection).toEqual(true)
        expect(deadLetteringOnMessageExpiration).toEqual(true)
        expect(duplicateDetectionHistoryTimeWindow).toEqual('PT1M')
      })
  })

  test('provisions subscription with default maxDeliveryCount', () => {
    pulumi.all([minimalSbStack.construct.serviceBusSubscription.maxDeliveryCount]).apply(([maxDeliveryCount]) => {
      expect(maxDeliveryCount).toEqual(1)
    })
  })
})

describe('TestAzureServicebusConstruct - resolveServiceBusQueue', () => {
  test('resolves existing service bus queue', () => {
    expect(stack.construct.resolvedServiceBusQueue).toBeDefined()
  })
})
