import * as pulumi from '@pulumi/pulumi'
import {
  AzureApiWithCache,
  AzureLocation,
  AzureRestApiWithCache,
  AzureRestApiWithCacheProps,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/rest-api-with-cache.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: any
  declare construct: TestRestApiWithCacheConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestRestApiWithCacheConstruct(props.name, this.props)
  }
}

class TestRestApiWithCacheConstruct extends AzureRestApiWithCache {
  declare props: AzureRestApiWithCacheProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiWithCacheProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = {} as AzureApiWithCache
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveApiKeyVault()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createApiManagement()
    this.createNamespaceSecretRole()
    this.createNamespaceSecret()
    this.createSubscriptionKeySecret()
    this.createApiManagementLogger()
    this.createApiDiagnostic()
    this.createDiagnosticLog()
    this.createRedisCache()
    this.createRedisCacheSecret()
    this.createRedisCacheNamespace()
    this.createRedisCacheApiManagement()
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath ?? '',
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    if (args.type === 'azure-native:resources:ResourceGroup') {
      name = args.inputs.resourceGroupName
    } else if (args.type === 'azure-native:apimanagement:ApiManagementService') {
      name = args.inputs.serviceName
    } else if (args.type === 'azure-native:redis:Redis') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:monitor:DiagnosticSetting') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:authorization:RoleAssignment') {
      name = args.name
    } else if (args.type === 'azure-native:keyvault:Secret') {
      name = args.inputs.secretName
    } else if (args.type === 'azure-native:apimanagement:NamedValue') {
      name = args.inputs.displayName
    } else if (args.type === 'azure-native:apimanagement:Cache') {
      name = args.name
    } else if (args.type === 'azure-native:apimanagement:Logger') {
      name = args.name
    } else if (args.type === 'azure-native:apimanagement:ApiDiagnostic') {
      name = args.name
    } else if (args.type === 'azure-native:apimanagement:Subscription') {
      name = args.name
    }

    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        name,
        identity: { principalId: 'mock-principal-id' },
        accessKeys: { primaryKey: 'mock-redis-primary-key' },
        location: 'eastus',
      },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.api).toBeDefined()
    expect(stack.construct.resourceGroup).toBeDefined()
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('provisions resource group as expected', () => {
    pulumi
      .all([
        stack.construct.resourceGroup.id,
        stack.construct.resourceGroup.urn,
        stack.construct.resourceGroup.name,
        stack.construct.resourceGroup.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-rg-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:resources:ResourceGroup::test-common-stack-rg'
        )
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('provisions api management service as expected', () => {
    pulumi
      .all([
        stack.construct.api.apim.id,
        stack.construct.api.apim.urn,
        stack.construct.api.apim.name,
        stack.construct.api.apim.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-am-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:apimanagement:ApiManagementService::test-common-stack-am'
        )
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('provisions redis cache as expected', () => {
    pulumi
      .all([
        stack.construct.api.redis.id,
        stack.construct.api.redis.urn,
        stack.construct.api.redis.name,
        stack.construct.api.redis.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-rc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:redis:Redis::test-common-stack-rc'
        )
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('resolves api key vault as expected', () => {
    expect(stack.construct.api.authKeyVault).toBeDefined()
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('provisions namespace secret role as expected', () => {
    expect(stack.construct.api.namedValueRoleAssignment).toBeDefined()
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('provisions redis cache secret as expected', () => {
    expect(stack.construct.api.redisNamedValueSecret).toBeDefined()
    pulumi.all([stack.construct.api.redisNamedValueSecret.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })
})

describe('TestAzureRestApiWithCacheConstruct', () => {
  test('provisions redis cache namespace as expected', () => {
    expect(stack.construct.api.redisNamedValue).toBeDefined()
    pulumi.all([stack.construct.api.redisNamedValue.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })
})

/* --- Test for full initResources() flow --- */

class TestRestApiWithCacheFullConstruct extends AzureRestApiWithCache {
  declare props: AzureRestApiWithCacheProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiWithCacheProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = {} as AzureApiWithCache
    this.initResources()
  }
}

class TestCommonStackFull extends CommonAzureStack {
  declare props: any
  declare construct: TestRestApiWithCacheFullConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestRestApiWithCacheFullConstruct(`${props.name}-full`, this.props)
  }
}

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackProps.extraContexts))
const stackFull = new TestCommonStackFull('test-full-stack', testStackProps)

describe('TestAzureRestApiWithCacheFullConstruct', () => {
  test('full initResources covers super.initResources and cache methods', () => {
    expect(stackFull).toBeDefined()
    expect(stackFull.construct).toBeDefined()
    expect(stackFull.construct.api).toBeDefined()
    expect(stackFull.construct.api.redis).toBeDefined()
    expect(stackFull.construct.api.redisNamedValueSecret).toBeDefined()
    expect(stackFull.construct.api.redisNamedValue).toBeDefined()
  })
})
