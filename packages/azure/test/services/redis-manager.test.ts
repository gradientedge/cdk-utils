import { Redis } from '@pulumi/azure-native/redis/index.js'
import * as pulumi from '@pulumi/pulumi'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps, RedisProps } from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testRedisCache: RedisProps
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
  redisCache: Redis

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.redisCache = this.redisManager.createManagedRedis(
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
    } else if (args.type === 'azure-native:redis:Redis') {
      name = args.inputs.name
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
    expect(stack.construct.redisCache).toBeDefined()
  })
})

describe('TestAzureRedisConstruct - Resource Group Fallback', () => {
  test('createManagedRedis throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgRedisConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.redisManager.createManagedRedis('test-no-rg-redis', this, {
            name: 'test-no-rg-redis',
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
  redisCache: Redis

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.redisCache = this.redisManager.createManagedRedis(`test-minimal-redis-${this.props.stage}`, this, {
      name: 'test-minimal-redis',
      resourceGroupName: 'test-rg-dev',
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
  test('redis cache uses default sku when not provided', () => {
    pulumi.all([minimalRedisStack.construct.redisCache.sku]).apply(([sku]) => {
      expect(sku?.name).toEqual('Basic')
      expect(sku?.family).toEqual('C')
      expect(sku?.capacity).toEqual(0)
    })
  })

  test('redis cache uses default tags when not provided', () => {
    pulumi.all([minimalRedisStack.construct.redisCache.tags]).apply(([tags]) => {
      expect(tags?.environment).toEqual('dev')
    })
  })

  test('redis cache uses default location from scope when not provided', () => {
    pulumi.all([minimalRedisStack.construct.redisCache.location]).apply(([location]) => {
      expect(location).toEqual('eastus')
    })
  })
})

describe('TestAzureRedisConstruct', () => {
  test('provisions managed redis as expected', () => {
    pulumi
      .all([
        stack.construct.redisCache.id,
        stack.construct.redisCache.urn,
        stack.construct.redisCache.name,
        stack.construct.redisCache.location,
        stack.construct.redisCache.sku,
        stack.construct.redisCache.minimumTlsVersion,
        stack.construct.redisCache.enableNonSslPort,
        stack.construct.redisCache.tags,
      ])
      .apply(([id, urn, name, location, sku, tlsVersion, nonSslPort, tags]) => {
        expect(id).toEqual('test-redis-cache-dev-rc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:redis:Redis::test-redis-cache-dev-rc'
        )
        expect(name).toEqual('test-redis-cache-dev')
        expect(location).toEqual('eastus')
        expect(sku).toEqual({ capacity: 2, family: 'C', name: 'Basic' })
        expect(tlsVersion).toEqual('1.2')
        expect(nonSslPort).toEqual(false)
        expect(tags?.environment).toEqual('dev')
      })
  })
})
