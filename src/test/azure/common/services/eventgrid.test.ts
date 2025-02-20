import { EventgridTopic } from '@cdktf/provider-azurerm/lib/eventgrid-topic'
import { EventgridEventSubscription } from '@cdktf/provider-azurerm/lib/eventgrid-event-subscription'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  EventgridTopicProps,
  EventgridEventSubscriptionProps,
} from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testEventgridTopic: EventgridTopicProps
  testEventgridEventSubscription: EventgridEventSubscriptionProps
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
    this.eventGridManager.createEventgridTopic(
      `test-eventgrid-topic-${this.props.stage}`,
      this,
      this.props.testEventgridTopic
    )

    this.eventGridManager.createEventgridSubscription(
      `test-eventgrid-subscription-${this.props.stage}`,
      this,
      this.props.testEventgridEventSubscription
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(EventgridTopic, {}))

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
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
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
  test('provisions cosmosdb topic as expected', () => {
    expect(construct).toHaveResourceWithProperties(EventgridTopic, {
      location: '${data.azurerm_resource_group.test-eventgrid-topic-dev-et-rg.location}',
      name: 'test-eventgrid-topic-dev',
      resource_group_name: '${data.azurerm_resource_group.test-eventgrid-topic-dev-et-rg.name}',
      tags: {
        environment: 'dev',
      },
    })
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions cosmosdb subscription as expected', () => {
    expect(construct).toHaveResourceWithProperties(EventgridEventSubscription, {
      name: 'test-eventgrid-subscription-dev',
    })
  })
})
