import {
  EventSubscription,
  SystemTopic,
  SystemTopicEventSubscription,
  Topic,
} from '@pulumi/azure-native/eventgrid/index.js'
import * as pulumi from '@pulumi/pulumi'
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
    return { ...baseProps, testEventgridTopic: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  eventgridTopic: Topic
  eventgridSubscription: EventSubscription
  eventgridSystemTopic: SystemTopic
  eventgridSystemEventSubscription: SystemTopicEventSubscription

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.eventgridTopic = this.eventgridManager.createEventgridTopic(
      `test-eventgrid-topic-${this.props.stage}`,
      this,
      this.props.testEventgridTopic
    )

    this.eventgridSubscription = this.eventgridManager.createEventgridSubscription(
      `test-eventgrid-subscription-${this.props.stage}`,
      this,
      this.props.testEventgridEventSubscription
    )

    this.eventgridSystemTopic = this.eventgridManager.createEventgridSystemTopic(
      `test-eventgrid-system-topic-${this.props.stage}`,
      this,
      this.props.testEventgridSystemTopic
    )

    this.eventgridSystemEventSubscription = this.eventgridManager.createEventgridSystemTopicEventSubscription(
      `test-eventgrid-subscription-${this.props.stage}`,
      this,
      this.props.testEventgridSystemEventSubscription,
      this.eventgridSystemTopic
    )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:eventgrid:Topic') {
      name = args.inputs.topicName
    } else if (args.type === 'azure-native:eventgrid:EventSubscription') {
      name = args.inputs.eventSubscriptionName
    } else if (args.type === 'azure-native:eventgrid:SystemTopic') {
      name = args.inputs.systemTopicName
    } else if (args.type === 'azure-native:eventgrid:SystemTopicEventSubscription') {
      name = args.inputs.eventSubscriptionName
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureEventgridConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-eventgrid-topic-dev')
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.eventgridTopic).toBeDefined()
    expect(stack.construct.eventgridSubscription).toBeDefined()
    expect(stack.construct.eventgridSystemTopic).toBeDefined()
    expect(stack.construct.eventgridSystemEventSubscription).toBeDefined()
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid topic as expected', () => {
    pulumi
      .all([
        stack.construct.eventgridTopic.id,
        stack.construct.eventgridTopic.urn,
        stack.construct.eventgridTopic.name,
        stack.construct.eventgridTopic.location,
        stack.construct.eventgridTopic.tags,
      ])
      .apply(([id, urn, name, location, tags]) => {
        expect(id).toEqual('test-eventgrid-topic-dev-et-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:eventgrid:Topic::test-eventgrid-topic-dev-et'
        )
        expect(name).toEqual('test-eventgrid-topic-dev')
        expect(location).toEqual('eastus')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid subscription as expected', () => {
    pulumi
      .all([
        stack.construct.eventgridSubscription.id,
        stack.construct.eventgridSubscription.urn,
        stack.construct.eventgridSubscription.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-eventgrid-subscription-dev-es-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:eventgrid:EventSubscription::test-eventgrid-subscription-dev-es'
        )
        expect(name).toEqual('test-eventgrid-subscription-dev')
      })
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid topic as expected', () => {
    pulumi
      .all([
        stack.construct.eventgridSystemTopic.id,
        stack.construct.eventgridSystemTopic.urn,
        stack.construct.eventgridSystemTopic.name,
        stack.construct.eventgridSystemTopic.location,
        stack.construct.eventgridSystemTopic.tags,
      ])
      .apply(([id, urn, name, location, tags]) => {
        expect(id).toEqual('test-eventgrid-system-topic-dev-est-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:eventgrid:SystemTopic::test-eventgrid-system-topic-dev-est'
        )
        expect(name).toEqual('test-eventgrid-system-topic-dev')
        expect(location).toEqual('eastus')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureEventgridConstruct', () => {
  test('provisions eventgrid subscription as expected', () => {
    pulumi
      .all([
        stack.construct.eventgridSystemEventSubscription.id,
        stack.construct.eventgridSystemEventSubscription.urn,
        stack.construct.eventgridSystemEventSubscription.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-eventgrid-subscription-dev-ests-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:eventgrid:SystemTopicEventSubscription::test-eventgrid-subscription-dev-ests'
        )
        expect(name).toEqual('test-eventgrid-system-subscription-dev')
      })
  })
})
