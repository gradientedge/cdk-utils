import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  EventgridEventSubscriptionProps,
  EventgridSystemTopicEventSubscriptionProps,
  EventgridSystemTopicProps,
  EventgridTopicProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testEventgridTopic: EventgridTopicProps
  testEventgridEventSubscription: EventgridEventSubscriptionProps
  testEventgridSystemTopic: EventgridSystemTopicProps
  testEventgridSystemEventSubscription: EventgridSystemTopicEventSubscriptionProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/eventgrid.json'],
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
      testEventgridTopic: this.node.tryGetContext('testEventgridTopic'),
      testEventgridEventSubscription: this.node.tryGetContext('testEventgridEventSubscription'),
      testEventgridSystemTopic: this.node.tryGetContext('testEventgridSystemTopic'),
      testEventgridSystemEventSubscription: this.node.tryGetContext('testEventgridSystemEventSubscription'),
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
    this.eventgridManager.createEventgridTopic(
      `test-eventgrid-topic-${this.props.stage}`,
      this,
      this.props.testEventgridTopic
    )

    this.eventgridManager.createEventgridSubscription(
      `test-eventgrid-subscription-${this.props.stage}`,
      this,
      this.props.testEventgridEventSubscription
    )

    const eventgridSystemTopic = this.eventgridManager.createEventgridSystemTopic(
      `test-eventgrid-system-topic-${this.props.stage}`,
      this,
      this.props.testEventgridSystemTopic
    )

    this.eventgridManager.createEventgridSystemTopicEventSubscription(
      `test-eventgrid-subscription-${this.props.stage}`,
      this,
      this.props.testEventgridSystemEventSubscription,
      eventgridSystemTopic
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureEventgridConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-eventgrid-topic-dev')
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(Testing.toBeValidTerraform(stack)).toBeTruthy()
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testEventgridSubscriptionDevEventgridSubscriptionFriendlyUniqueId: {
        value: 'test-eventgrid-subscription-dev-es',
      },
      testEventgridSubscriptionDevEventgridSubscriptionId: {
        value: '${azurerm_eventgrid_event_subscription.test-eventgrid-subscription-dev-es.id}',
      },
      testEventgridSubscriptionDevEventgridSubscriptiontName: {
        value: '${azurerm_eventgrid_event_subscription.test-eventgrid-subscription-dev-es.name}',
      },
      testEventgridTopicDevEventgridTopicFriendlyUniqueId: {
        value: 'test-eventgrid-topic-dev-et',
      },
      testEventgridTopicDevEventgridTopicId: {
        value: '${azurerm_eventgrid_topic.test-eventgrid-topic-dev-et.id}',
      },
      testEventgridTopicDevEventgridTopicName: {
        value: '${azurerm_eventgrid_topic.test-eventgrid-topic-dev-et.name}',
      },
    })
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid topic as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'EventgridTopic', {
        location: '${data.azurerm_resource_group.test-eventgrid-topic-dev-et-rg.location}',
        name: 'test-eventgrid-topic-dev',
        resource_group_name: '${data.azurerm_resource_group.test-eventgrid-topic-dev-et-rg.name}',
        tags: {
          environment: 'dev',
        },
      })
    )
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid subscription as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'EventgridEventSubscription', {
        name: 'test-eventgrid-subscription-dev',
      })
    )
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid topic as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'EventgridSystemTopic', {
        location: '${data.azurerm_resource_group.test-eventgrid-system-topic-dev-est-rg.location}',
        name: 'test-eventgrid-system-topic-dev',
        resource_group_name: '${data.azurerm_resource_group.test-eventgrid-system-topic-dev-est-rg.name}',
        tags: {
          environment: 'dev',
        },
      })
    )
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid subscription as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'EventgridSystemTopicEventSubscription', {
        name: 'test-eventgrid-system-subscription-dev',
      })
    )
  })
})
