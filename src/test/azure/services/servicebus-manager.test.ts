import { Namespace, Queue, Subscription, Topic } from '@pulumi/azure-native/servicebus/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ServicebusNamespaceProps,
  ServicebusQueueProps,
  ServicebusSubscriptionProps,
  ServicebusTopicProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testServicebusNamespace: ServicebusNamespaceProps
  testServicebusTopic: ServicebusTopicProps
  testServicebusQueue: ServicebusQueueProps
  testServicebusSubscription: ServicebusSubscriptionProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/servicebus.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
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
  servicebusNamespace: Namespace
  servicebusTopic: Topic
  servicebusQueue: Queue
  servicebusSubscription: Subscription
  resolvedServicebusQueue: any

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.servicebusNamespace = this.servicebusManager.createServicebusNamespace(
      `test-servicebus-namespace-${this.props.stage}`,
      this,
      this.props.testServicebusNamespace
    )

    this.servicebusTopic = this.servicebusManager.createServicebusTopic(
      `test-servicebus-topic-${this.props.stage}`,
      this,
      this.props.testServicebusTopic
    )

    this.servicebusQueue = this.servicebusManager.createServicebusQueue(
      `test-servicebus-queue-${this.props.stage}`,
      this,
      this.props.testServicebusQueue
    )

    this.servicebusSubscription = this.servicebusManager.createServicebusSubscription(
      `test-servicebus-subscription-${this.props.stage}`,
      this,
      this.props.testServicebusSubscription
    )

    this.resolvedServicebusQueue = this.servicebusManager.resolveServicebusQueue(
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
    expect(stack.construct.servicebusNamespace).toBeDefined()
    expect(stack.construct.servicebusTopic).toBeDefined()
    expect(stack.construct.servicebusQueue).toBeDefined()
    expect(stack.construct.servicebusSubscription).toBeDefined()
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus namespace as expected', () => {
    pulumi
      .all([
        stack.construct.servicebusNamespace.id,
        stack.construct.servicebusNamespace.urn,
        stack.construct.servicebusNamespace.name,
        stack.construct.servicebusNamespace.location,
        stack.construct.servicebusNamespace.sku,
        stack.construct.servicebusNamespace.identity,
        stack.construct.servicebusNamespace.tags,
      ])
      .apply(([id, urn, name, location, sku, identity, tags]) => {
        expect(id).toEqual('test-servicebus-namespace-dev-sn-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:servicebus:Namespace::test-servicebus-namespace-dev-sn'
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
        stack.construct.servicebusTopic.id,
        stack.construct.servicebusTopic.urn,
        stack.construct.servicebusTopic.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-servicebus-topic-dev-st-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:servicebus:Topic::test-servicebus-topic-dev-st'
        )
        expect(name).toEqual('test-servicebus-topic-dev')
      })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus queue as expected', () => {
    pulumi
      .all([
        stack.construct.servicebusQueue.id,
        stack.construct.servicebusQueue.urn,
        stack.construct.servicebusQueue.name,
        stack.construct.servicebusQueue.requiresDuplicateDetection,
        stack.construct.servicebusQueue.deadLetteringOnMessageExpiration,
      ])
      .apply(([id, urn, name, requiresDuplicateDetection, deadLetteringOnMessageExpiration]) => {
        expect(id).toEqual('test-servicebus-queue-dev-sq-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:servicebus:Queue::test-servicebus-queue-dev-sq'
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
        stack.construct.servicebusSubscription.id,
        stack.construct.servicebusSubscription.urn,
        stack.construct.servicebusSubscription.name,
        stack.construct.servicebusSubscription.maxDeliveryCount,
      ])
      .apply(([id, urn, name, maxDeliveryCount]) => {
        expect(id).toEqual('test-servicebus-subscription-dev-ss-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:servicebus:Subscription::test-servicebus-subscription-dev-ss'
        )
        expect(name).toEqual('test-servicebus-subscription-dev')
        expect(maxDeliveryCount).toEqual(1)
      })
  })
})
