import { ServicebusTopic } from '@cdktf/provider-azurerm/lib/servicebus-topic'
import { ServicebusSubscription } from '@cdktf/provider-azurerm/lib/servicebus-subscription'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ServicebusSubscriptionProps,
  ServicebusTopicProps,
  ServicebusQueueProps,
  ServicebusNamespaceProps,
} from '../../../lib'
import { ServicebusNamespace } from '@cdktf/provider-azurerm/lib/servicebus-namespace'
import { ServicebusQueue } from '@cdktf/provider-azurerm/lib/servicebus-queue'

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
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, props.name, this.props)
  }

  protected determineConstructProps(props: CommonAzureStackProps) {
    return {
      ...super.determineConstructProps(props),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testServicebusNamespace: this.node.tryGetContext('testServicebusNamespace'),
      testServicebusTopic: this.node.tryGetContext('testServicebusTopic'),
      testServicebusQueue: this.node.tryGetContext('testServicebusQueue'),
      testServicebusSubscription: this.node.tryGetContext('testServicebusSubscription'),
    }
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)
    const namespace = this.servicebusManager.createServicebusNamespace(
      `test-servicebus-namespace-${this.props.stage}`,
      this,
      this.props.testServicebusNamespace
    )

    const topic = this.servicebusManager.createServicebusTopic(`test-servicebus-topic-${this.props.stage}`, this, {
      ...this.props.testServicebusTopic,
      namespaceId: namespace.id,
    })

    this.servicebusManager.createServicebusQueue(`test-servicebus-topic-${this.props.stage}`, this, {
      ...this.props.testServicebusQueue,
      namespaceId: namespace.id,
    })

    this.servicebusManager.createServicebusSubscription(`test-servicebus-subscription-${this.props.stage}`, this, {
      ...this.props.testServicebusSubscription,
      topicId: topic.id,
    })
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(ServicebusTopic, {}))

describe('TestAzureServicebusConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-servicebus-namespace-dev')
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testServicebusSubscriptionDevServicebusSubscriptionFriendlyUniqueId: {
        value: 'test-servicebus-subscription-dev-ss',
      },
      testServicebusSubscriptionDevServicebusSubscriptionId: {
        value: '${azurerm_servicebus_subscription.test-servicebus-subscription-dev-ss.id}',
      },
      testServicebusTopicDevServicebusTopicFriendlyUniqueId: {
        value: 'test-servicebus-topic-dev-st',
      },
      testServicebusNamespaceDevServicebusNamespaceFriendlyUniqueId: {
        value: 'test-servicebus-namespace-dev-sn',
      },
      testServicebusTopicDevServicebusTopicId: {
        value: '${azurerm_servicebus_topic.test-servicebus-topic-dev-st.id}',
      },
      testServicebusNamespaceDevServicebusNamespaceId: {
        value: '${azurerm_servicebus_namespace.test-servicebus-namespace-dev-sn.id}',
      },
      testServicebusTopicDevServicebusTopicName: {
        value: '${azurerm_servicebus_topic.test-servicebus-topic-dev-st.name}',
      },
      testServicebusNamespaceDevServicebusNamespaceName: {
        value: '${azurerm_servicebus_namespace.test-servicebus-namespace-dev-sn.name}',
      },
    })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus namespace as expected', () => {
    expect(construct).toHaveResourceWithProperties(ServicebusNamespace, {
      identity: {
        type: 'SystemAssigned',
      },
      location: '${data.azurerm_resource_group.test-servicebus-namespace-dev-sn-rg.location}',
      name: 'test-servicebus-namespace-dev',
      resource_group_name: '${data.azurerm_resource_group.test-servicebus-namespace-dev-sn-rg.name}',
      sku: 'Standard',
      tags: {
        environment: 'dev',
      },
    })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus topic as expected', () => {
    expect(construct).toHaveResourceWithProperties(ServicebusTopic, {
      name: 'test-servicebus-topic-dev',
      namespace_id: '${azurerm_servicebus_namespace.test-servicebus-namespace-dev-sn.id}',
    })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus queue as expected', () => {
    expect(construct).toHaveResourceWithProperties(ServicebusQueue, {
      name: 'test-servicebus-queue-dev',
      namespace_id: '${azurerm_servicebus_namespace.test-servicebus-namespace-dev-sn.id}',
    })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus subscription as expected', () => {
    expect(construct).toHaveResourceWithProperties(ServicebusSubscription, {
      max_delivery_count: 1,
      name: 'test-servicebus-subscription-dev',
      topic_id: '${azurerm_servicebus_topic.test-servicebus-topic-dev-st.id}',
    })
  })
})
