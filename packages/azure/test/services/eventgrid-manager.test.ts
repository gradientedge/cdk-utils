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
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testEventgridTopic: EventgridTopicProps
  testEventgridEventSubscription: EventgridEventSubscriptionProps
  testEventgridSystemTopic: EventgridSystemTopicProps
  testEventgridSystemEventSubscription: EventgridSystemTopicEventSubscriptionProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/eventgrid.json'],
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

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:eventgrid:Topic::test-eventgrid-topic-dev-et'
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:eventgrid:EventSubscription::test-eventgrid-subscription-dev-es'
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:eventgrid:SystemTopic::test-eventgrid-system-topic-dev-est'
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:eventgrid:SystemTopicEventSubscription::test-eventgrid-subscription-dev-ests'
        )
        expect(name).toEqual('test-eventgrid-system-subscription-dev')
      })
  })
})

/* --- Tests for default value fallback branches --- */
class TestMinimalEventgridConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  eventgridTopic: Topic
  eventgridSubscription: EventSubscription
  eventgridSystemTopic: SystemTopic

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)

    // Topic with minimal props - exercises location/tags defaults
    this.eventgridTopic = this.eventgridManager.createEventgridTopic(
      `test-minimal-eg-topic-${this.props.stage}`,
      this,
      {
        topicName: 'test-minimal-eg-topic',
        resourceGroupName: 'test-rg-dev',
      } as any
    )

    // Subscription with minimal props - exercises eventDeliverySchema/retryPolicy defaults
    this.eventgridSubscription = this.eventgridManager.createEventgridSubscription(
      `test-minimal-eg-sub-${this.props.stage}`,
      this,
      {
        eventSubscriptionName: 'test-minimal-eg-sub',
        scope:
          '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.EventGrid/topics/test-eg-topic-dev',
        destination: {
          endpointType: 'WebHook',
          properties: { endpointUrl: 'https://test.example.com/webhook' },
        },
      } as any
    )

    // System topic with minimal props - exercises location/tags defaults
    this.eventgridSystemTopic = this.eventgridManager.createEventgridSystemTopic(
      `test-minimal-eg-sys-topic-${this.props.stage}`,
      this,
      {
        systemTopicName: 'test-minimal-eg-sys-topic',
        resourceGroupName: 'test-rg-dev',
        source: '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.Storage/storageAccounts/testsa',
        topicType: 'Microsoft.Storage.StorageAccounts',
      } as any
    )
  }
}

class TestMinimalEventgridStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalEventgridConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalEventgridConstruct(props.name, this.props)
  }
}

const minimalEventgridStack = new TestMinimalEventgridStack('test-minimal-eg-stack', testStackProps)

describe('TestAzureEventgridConstruct - Default Values', () => {
  test('eventgrid topic uses default location from scope when not provided', () => {
    pulumi.all([minimalEventgridStack.construct.eventgridTopic.location]).apply(([location]) => {
      expect(location).toEqual('eastus')
    })
  })

  test('eventgrid topic uses default tags when not provided', () => {
    pulumi.all([minimalEventgridStack.construct.eventgridTopic.tags]).apply(([tags]) => {
      expect(tags?.environment).toEqual('dev')
    })
  })

  test('eventgrid subscription uses default eventDeliverySchema when not provided', () => {
    pulumi.all([minimalEventgridStack.construct.eventgridSubscription.eventDeliverySchema]).apply(([schema]) => {
      expect(schema).toEqual('CloudEventSchemaV1_0')
    })
  })

  test('eventgrid subscription uses default retryPolicy when not provided', () => {
    pulumi.all([minimalEventgridStack.construct.eventgridSubscription.retryPolicy]).apply(([retryPolicy]) => {
      expect(retryPolicy?.eventTimeToLiveInMinutes).toEqual(1440)
      expect(retryPolicy?.maxDeliveryAttempts).toEqual(7)
    })
  })

  test('eventgrid system topic uses default location from scope when not provided', () => {
    pulumi.all([minimalEventgridStack.construct.eventgridSystemTopic.location]).apply(([location]) => {
      expect(location).toEqual('eastus')
    })
  })

  test('eventgrid system topic uses default tags when not provided', () => {
    pulumi.all([minimalEventgridStack.construct.eventgridSystemTopic.tags]).apply(([tags]) => {
      expect(tags?.environment).toEqual('dev')
    })
  })
})

describe('TestAzureEventgridConstruct - Resource Group Fallback', () => {
  test('createEventgridTopic throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgEgConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.eventgridManager.createEventgridTopic('test-no-rg-eg-topic', this, {
            topicName: 'test-no-rg-topic',
          } as any)
        }
      }
      class NoRgEgStack extends CommonAzureStack {
        constructor(name: string, props: any) {
          super(name, { ...testStackProps, resourceGroupName: undefined })
          new NoRgEgConstruct(props.name, this.props)
        }
      }
      new NoRgEgStack('test-no-rg-eg-stack', testStackProps)
    }).toThrow('Resource group name undefined for test-no-rg-eg-topic')
  })

  test('createEventgridSystemTopic throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgSysTopicConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.eventgridManager.createEventgridSystemTopic('test-no-rg-sys-topic', this, {
            systemTopicName: 'test-no-rg-sys-topic',
            source: '/subscriptions/test-sub',
            topicType: 'Microsoft.Storage.StorageAccounts',
          } as any)
        }
      }
      class NoRgSysTopicStack extends CommonAzureStack {
        constructor(name: string, props: any) {
          super(name, { ...testStackProps, resourceGroupName: undefined })
          new NoRgSysTopicConstruct(props.name, this.props)
        }
      }
      new NoRgSysTopicStack('test-no-rg-sys-topic-stack', testStackProps)
    }).toThrow('Resource group name undefined for test-no-rg-sys-topic')
  })

  test('createEventgridSystemTopicEventSubscription throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgSysSubConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.eventgridManager.createEventgridSystemTopicEventSubscription(
            'test-no-rg-sys-sub',
            this,
            {
              eventSubscriptionName: 'test-no-rg-sys-sub',
            } as any,
            { name: 'test-topic' } as any
          )
        }
      }
      class NoRgSysSubStack extends CommonAzureStack {
        constructor(name: string, props: any) {
          super(name, { ...testStackProps, resourceGroupName: undefined })
          new NoRgSysSubConstruct(props.name, this.props)
        }
      }
      new NoRgSysSubStack('test-no-rg-sys-sub-stack', testStackProps)
    }).toThrow('Resource group name undefined for test-no-rg-sys-sub')
  })
})
