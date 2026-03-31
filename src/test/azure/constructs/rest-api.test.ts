import * as pulumi from '@pulumi/pulumi'
import {
  AzureApi,
  AzureLocation,
  AzureRestApi,
  AzureRestApiProps,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/config/dummy.json', 'src/test/azure/common/config/rest-api.json'],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: any
  declare construct: TestRestApiConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestRestApiConstruct(props.name, this.props)
  }
}

class TestRestApiConstruct extends AzureRestApi {
  declare props: AzureRestApiProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = {} as AzureApi
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveApiKeyVault()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
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

describe('TestAzureRestApiConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureRestApiConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.api).toBeDefined()
    expect(stack.construct.resourceGroup).toBeDefined()
  })
})

describe('TestAzureRestApiConstruct', () => {
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

describe('TestAzureRestApiConstruct', () => {
  test('resolves api key vault as expected', () => {
    expect(stack.construct.api.authKeyVault).toBeDefined()
  })
})

describe('TestAzureRestApiConstruct', () => {
  test('resolves application insights as expected', () => {
    expect(stack.construct.applicationInsights).toBeDefined()
  })
})
