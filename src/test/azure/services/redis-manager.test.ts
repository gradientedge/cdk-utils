import { Redis } from '@pulumi/azure-native/redis/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ManagedRedisProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testRedisCache: ManagedRedisProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/redis.json'],
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
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:redis:Redis::test-redis-cache-dev-rc'
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
