import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ManagedRedisResult,
  RedisEnterpriseClusterProps,
} from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testRedisCache: RedisEnterpriseClusterProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/redis.json'],
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
    return { ...baseProps, testRedisCache: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  redisResult: ManagedRedisResult

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.redisResult = this.redisManager.createManagedRedis(
      `test-redis-cache-${this.props.stage}`,
      this,
      this.props.testRedisCache
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
    if (args.type === 'azure-native:resources:ResourceGroup') {
      name = args.inputs.resourceGroupName
    } else if (args.type === 'azure-native:redisenterprise:RedisEnterprise') {
      name = args.inputs.clusterName
    } else if (args.type === 'azure-native:redisenterprise:Database') {
      name = args.inputs.databaseName
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

describe('TestAzureRedisConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-redis-cache-dev')
  })
})

describe('TestAzureRedisConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureRedisConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.redisResult).toBeDefined()
    expect(stack.construct.redisResult.cluster).toBeDefined()
    expect(stack.construct.redisResult.database).toBeDefined()
  })
})

describe('TestAzureRedisConstruct - Resource Group Fallback', () => {
  test('createManagedRedis throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgRedisConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.redisManager.createManagedRedis('test-no-rg-redis', this, {
            sku: { name: 'Balanced_B0' },
          } as any)
        }
      }
      class NoRgRedisStack extends CommonAzureStack {
        constructor(name: string, props: any) {
          super(name, { ...testStackProps, resourceGroupName: undefined })
          new NoRgRedisConstruct(props.name, this.props)
        }
      }
      new NoRgRedisStack('test-no-rg-redis-stack', testStackProps)
    }).toThrow('Resource group name undefined for test-no-rg-redis')
  })
})

/* --- Tests for default sku values --- */

class TestMinimalRedisConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  redisResult: ManagedRedisResult

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.redisResult = this.redisManager.createManagedRedis(`test-minimal-redis-${this.props.stage}`, this, {
      clusterName: 'test-minimal-redis',
      resourceGroupName: 'test-rg-dev',
      sku: { name: 'Balanced_B0' },
    } as any)
  }
}

class TestMinimalRedisStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalRedisConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalRedisConstruct(props.name, this.props)
  }
}

const minimalRedisStack = new TestMinimalRedisStack('test-minimal-redis-stack', testStackProps)

describe('TestAzureRedisConstruct - Default Values', () => {
  test('redis cluster uses default sku when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalRedisStack.construct.redisResult.cluster.sku]).apply(([sku]) => {
        expect(sku?.name).toEqual('Balanced_B0')
      })
    )
  })

  test('redis cluster uses default tags when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalRedisStack.construct.redisResult.cluster.tags]).apply(([tags]) => {
        expect(tags?.environment).toEqual('dev')
      })
    )
  })

  test('redis cluster uses default location from scope when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalRedisStack.construct.redisResult.cluster.location]).apply(([location]) => {
        expect(location).toEqual('eastus')
      })
    )
  })
})

describe('TestAzureRedisConstruct', () => {
  test('provisions managed redis as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.redisResult.cluster.id,
          stack.construct.redisResult.cluster.urn,
          stack.construct.redisResult.cluster.name,
          stack.construct.redisResult.cluster.location,
          stack.construct.redisResult.cluster.sku,
          stack.construct.redisResult.cluster.minimumTlsVersion,
          stack.construct.redisResult.cluster.tags,
        ])
        .apply(([id, urn, name, location, sku, tlsVersion, tags]) => {
          expect(id).toEqual('test-redis-cache-dev-rc-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:redisenterprise:RedisEnterprise::test-redis-cache-dev-rc'
          )
          expect(name).toEqual('test-redis-cache-dev')
          expect(location).toEqual('eastus')
          expect(sku).toEqual({ name: 'Balanced_B0' })
          expect(tlsVersion).toEqual('1.2')
          expect(tags?.environment).toEqual('dev')
        })
    )
  })

  test('provisions redis database as expected', async () => {
    await outputToPromise(
      pulumi
        .all([stack.construct.redisResult.database.id, stack.construct.redisResult.database.name])
        .apply(([id, name]) => {
          expect(id).toEqual('test-redis-cache-dev-db-id')
          expect(name).toEqual('default')
        })
    )
  })
})
