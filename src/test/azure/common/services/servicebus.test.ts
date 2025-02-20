import { ServicebusTopic } from '@cdktf/provider-azurerm/lib/servicebus-topic'
import { ServicebusSubscription } from '@cdktf/provider-azurerm/lib/servicebus-subscription'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ServicebusTopicProps,
  ServicebusSubscriptionProps,
} from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testServicebusTopic: ServicebusTopicProps
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
      testServicebusTopic: this.node.tryGetContext('testServicebusTopic'),
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
    this.serviceBusManager.createServicebusTopic(
      `test-servicebus-topic-${this.props.stage}`,
      this,
      this.props.testServicebusTopic
    )

    this.serviceBusManager.createServicebusSubscription(
      `test-servicebus-subscription-${this.props.stage}`,
      this,
      this.props.testServicebusSubscription
    )
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
    expect(error).toThrow('Props undefined for test-servicebus-topic-dev')
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
      testServicebusTopicDevServicebusTopicId: {
        value: '${azurerm_servicebus_topic.test-servicebus-topic-dev-st.id}',
      },
      testServicebusTopicDevServicebusTopicName: {
        value: '${azurerm_servicebus_topic.test-servicebus-topic-dev-st.name}',
      },
    })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions cosmosdb topic as expected', () => {
    expect(construct).toHaveResourceWithProperties(ServicebusTopic, {
      name: 'test-servicebus-topic-dev',
    })
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions cosmosdb subscription as expected', () => {
    expect(construct).toHaveResourceWithProperties(ServicebusSubscription, {
      name: 'test-servicebus-subscription-dev',
    })
  })
})
