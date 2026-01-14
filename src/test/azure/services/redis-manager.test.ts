import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
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
      testRedisCache: this.node.tryGetContext('testRedisCache'),
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
    this.redisManager.createManagedRedis(`test-redis-cache-${this.props.stage}`, this, this.props.testRedisCache)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureRedisConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-redis-cache-dev')
  })
})

describe('TestAzureRedisConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureRedisConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(Testing.toBeValidTerraform(stack)).toBeTruthy()
  })
})

describe('TestAzureRedisConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testRedisCacheDevManagedRedisFriendlyUniqueId: {
        value: 'test-redis-cache-dev-rc',
      },
      testRedisCacheDevManagedRedisId: {
        value: '${azurerm_managed_redis.test-redis-cache-dev-rc.id}',
      },
      testRedisCacheDevManagedRedisName: {
        value: '${azurerm_managed_redis.test-redis-cache-dev-rc.name}',
      },
    })
  })
})

describe('TestAzureRedisConstruct', () => {
  test('provisions managed redis as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'ManagedRedis', {
        capacity: 2,
        family: 'C',
        location: '${data.azurerm_resource_group.test-redis-cache-dev-rc-rg.location}',
        minimum_tls_version: '1.2',
        name: 'test-redis-cache-dev',
        non_ssl_port_enabled: false,
        resource_group_name: '${data.azurerm_resource_group.test-redis-cache-dev-rc-rg.name}',
        sku_name: 'Basic',
        tags: {
          environment: 'dev',
        },
      })
    )
  })
})
