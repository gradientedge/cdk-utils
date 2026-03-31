import * as pulumi from '@pulumi/pulumi'
import {
  AzureApiWithCache,
  AzureLocation,
  AzureRestApiWithCache,
  AzureRestApiWithCacheProps,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/config/dummy.json', 'src/test/azure/common/config/rest-api-with-cache.json'],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestRestApiWithCacheConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestRestApiWithCacheConstruct(
      props.name,
      this.props as unknown as AzureRestApiWithCacheProps & TestAzureStackProps
    )
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
    this.createRedisCache()
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:resources:ResourceGroup::test-common-stack-rg'
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:apimanagement:ApiManagementService::test-common-stack-am'
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:redis:Redis::test-common-stack-rc'
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
