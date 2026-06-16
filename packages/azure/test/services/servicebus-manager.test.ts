import { Namespace, Queue, SkuName, SkuTier, Subscription, Topic } from '@pulumi/azure-native/servicebus/index.js'
import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ServiceBusGeoReplicationRoleType,
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

const capturedDeployments: pulumi.runtime.MockResourceArgs[] = []

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
    } else if (args.type === 'azure-native:resources:Deployment') {
      name = args.inputs.deploymentName
      capturedDeployments.push(args)
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
  test('provisions servicebus namespace as expected', async () => {
    await outputToPromise(
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
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:servicebus:Namespace::test-servicebus-namespace-dev-sn'
          )
          expect(name).toEqual('test-servicebus-namespace-dev')
          expect(location).toEqual('eastus')
          expect(sku).toEqual({ name: 'Standard' })
          expect(identity).toEqual({ type: 'SystemAssigned' })
          expect(tags?.environment).toEqual('dev')
        })
    )
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus topic as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.serviceBusTopic.id,
          stack.construct.serviceBusTopic.urn,
          stack.construct.serviceBusTopic.name,
        ])
        .apply(([id, urn, name]) => {
          expect(id).toEqual('test-servicebus-topic-dev-st-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:servicebus:Topic::test-servicebus-topic-dev-st'
          )
          expect(name).toEqual('test-servicebus-topic-dev')
        })
    )
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus queue as expected', async () => {
    await outputToPromise(
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
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:servicebus:Queue::test-servicebus-queue-dev-sq'
          )
          expect(name).toEqual('test-servicebus-queue-dev')
          expect(requiresDuplicateDetection).toEqual(true)
          expect(deadLetteringOnMessageExpiration).toEqual(true)
        })
    )
  })
})

describe('TestAzureServicebusConstruct', () => {
  test('provisions servicebus subscription as expected', async () => {
    await outputToPromise(
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
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:servicebus:Subscription::test-servicebus-subscription-dev-ss'
          )
          expect(name).toEqual('test-servicebus-subscription-dev')
          expect(maxDeliveryCount).toEqual(1)
        })
    )
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
  test('provisions namespace with default identity, sku and tags', async () => {
    await outputToPromise(
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
    )
  })

  test('provisions topic as expected', () => {
    expect(minimalSbStack.construct.serviceBusTopic).toBeDefined()
  })

  test('provisions queue with default values', async () => {
    await outputToPromise(
      pulumi
        .all([
          minimalSbStack.construct.serviceBusQueue.requiresDuplicateDetection,
          minimalSbStack.construct.serviceBusQueue.deadLetteringOnMessageExpiration,
          minimalSbStack.construct.serviceBusQueue.duplicateDetectionHistoryTimeWindow,
        ])
        .apply(
          ([requiresDuplicateDetection, deadLetteringOnMessageExpiration, duplicateDetectionHistoryTimeWindow]) => {
            expect(requiresDuplicateDetection).toEqual(true)
            expect(deadLetteringOnMessageExpiration).toEqual(true)
            expect(duplicateDetectionHistoryTimeWindow).toEqual('PT1M')
          }
        )
    )
  })

  test('provisions subscription with default maxDeliveryCount', async () => {
    await outputToPromise(
      pulumi.all([minimalSbStack.construct.serviceBusSubscription.maxDeliveryCount]).apply(([maxDeliveryCount]) => {
        expect(maxDeliveryCount).toEqual(1)
      })
    )
  })
})

describe('TestAzureServicebusConstruct - resolveServiceBusQueue', () => {
  test('resolves existing service bus queue', () => {
    expect(stack.construct.resolvedServiceBusQueue).toBeDefined()
  })
})

/* --- Tests for geo-replication --- */

class TestGeoReplicationConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  serviceBusNamespace: Namespace

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.serviceBusNamespace = this.serviceBusManager.createServiceBusNamespace(
      `test-geo-sb-ns-${this.props.stage}`,
      this,
      {
        namespaceName: 'test-geo-sb-ns',
        resourceGroupName: 'test-rg-dev',
        sku: { name: SkuName.Premium, tier: SkuTier.Premium, capacity: 1 },
        enableGeoReplication: true,
        geoReplication: {
          maxReplicationLagDurationInSeconds: 0,
          locations: [
            { locationName: 'westeurope', roleType: ServiceBusGeoReplicationRoleType.Primary },
            { locationName: 'northeurope', roleType: ServiceBusGeoReplicationRoleType.Secondary },
          ],
        },
      }
    )
  }
}

class TestGeoReplicationStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestGeoReplicationConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestGeoReplicationConstruct(props.name, this.props)
  }
}

const geoStack = new TestGeoReplicationStack('test-geo-sb-stack', testStackProps)

describe('TestAzureServicebusConstruct - GeoReplication', () => {
  test('provisions namespace with Premium sku', async () => {
    await outputToPromise(
      pulumi
        .all([
          geoStack.construct.serviceBusNamespace.id,
          geoStack.construct.serviceBusNamespace.urn,
          geoStack.construct.serviceBusNamespace.name,
          geoStack.construct.serviceBusNamespace.location,
          geoStack.construct.serviceBusNamespace.sku,
          geoStack.construct.serviceBusNamespace.identity,
        ])
        .apply(([id, urn, name, location, sku, identity]) => {
          expect(id).toEqual('test-geo-sb-ns-dev-sn-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:servicebus:Namespace::test-geo-sb-ns-dev-sn'
          )
          expect(name).toEqual('test-geo-sb-ns-dev')
          expect(location).toEqual('eastus')
          expect(sku).toEqual({ name: 'Premium', tier: 'Premium', capacity: 1 })
          expect(identity).toEqual({ type: 'SystemAssigned' })
        })
    )
  })

  test('provisions ARM deployment for geo-replication with exact template', () => {
    const deployments = capturedDeployments.filter(deployment => deployment.name === 'test-geo-sb-ns-dev-sn-geo')
    expect(deployments.length).toEqual(1)
    const deployment = deployments[0]
    expect(deployment.type).toEqual('azure-native:resources:Deployment')
    expect(deployment.inputs.resourceGroupName).toEqual('test-rg-dev')
    expect(deployment.inputs.deploymentName).toEqual('test-geo-sb-ns-dev-sn-geo-dev')
    expect(deployment.inputs.properties).toEqual({
      mode: 'Incremental',
      template: {
        $schema: 'https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#',
        contentVersion: '1.0.0.0',
        resources: [
          {
            type: 'Microsoft.ServiceBus/namespaces',
            apiVersion: '2024-01-01',
            name: 'test-geo-sb-ns-dev',
            location: 'eastus',
            sku: { name: 'Premium', tier: 'Premium', capacity: 1 },
            properties: {
              geoDataReplication: {
                maxReplicationLagDurationInSeconds: 0,
                locations: [
                  { locationName: 'westeurope', roleType: 'Primary' },
                  { locationName: 'northeurope', roleType: 'Secondary' },
                ],
              },
            },
          },
        ],
      },
    })
  })

  test('throws when enableGeoReplication is true but geoReplication config is missing', () => {
    expect(() => {
      stack.construct.serviceBusManager.createServiceBusNamespace('test-geo-missing', stack.construct, {
        namespaceName: 'test-geo-missing',
        resourceGroupName: 'test-rg-dev',
        sku: { name: SkuName.Premium, tier: SkuTier.Premium, capacity: 1 },
        enableGeoReplication: true,
      })
    }).toThrow('enableGeoReplication is true but geoReplication config is missing for test-geo-missing')
  })

  test('throws when enableGeoReplication is true but sku is not Premium', () => {
    expect(() => {
      stack.construct.serviceBusManager.createServiceBusNamespace('test-geo-standard', stack.construct, {
        namespaceName: 'test-geo-standard',
        resourceGroupName: 'test-rg-dev',
        sku: { name: SkuName.Standard },
        enableGeoReplication: true,
        geoReplication: {
          maxReplicationLagDurationInSeconds: 0,
          locations: [
            { locationName: 'westeurope', roleType: ServiceBusGeoReplicationRoleType.Primary },
            { locationName: 'northeurope', roleType: ServiceBusGeoReplicationRoleType.Secondary },
          ],
        },
      })
    }).toThrow(
      'Service Bus geo-replication requires the Premium SKU, but test-geo-standard was configured with "Standard"'
    )
  })

  test('throws when enableGeoReplication is true and sku defaults to Standard', () => {
    expect(() => {
      stack.construct.serviceBusManager.createServiceBusNamespace('test-geo-default-sku', stack.construct, {
        namespaceName: 'test-geo-default-sku',
        resourceGroupName: 'test-rg-dev',
        enableGeoReplication: true,
        geoReplication: {
          maxReplicationLagDurationInSeconds: 0,
          locations: [
            { locationName: 'westeurope', roleType: ServiceBusGeoReplicationRoleType.Primary },
            { locationName: 'northeurope', roleType: ServiceBusGeoReplicationRoleType.Secondary },
          ],
        },
      })
    }).toThrow(
      'Service Bus geo-replication requires the Premium SKU, but test-geo-default-sku was configured with "Standard"'
    )
  })

  test('does not provision deployment when enableGeoReplication is false', () => {
    const before = capturedDeployments.length
    stack.construct.serviceBusManager.createServiceBusNamespace('test-geo-disabled', stack.construct, {
      namespaceName: 'test-geo-disabled',
      resourceGroupName: 'test-rg-dev',
      sku: { name: SkuName.Standard },
    })
    expect(capturedDeployments.length).toEqual(before)
  })
})
