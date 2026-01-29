import { ConfigurationStore } from '@pulumi/azure-native/appconfiguration/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  AppConfigurationProps,
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAppConfiguration: AppConfigurationProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/azure/common/cdkConfig/dummy.json',
    'src/test/azure/common/cdkConfig/app-configuration.json',
  ],
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
    return { ...baseProps, testAppConfiguration: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  appConfiguration: ConfigurationStore

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.appConfiguration = this.appConfigurationManager.createConfigurationStore(
      `test-app-configuration-${this.props.stage}`,
      this,
      this.props.testAppConfiguration
    )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:appconfiguration:ConfigurationStore') {
      name = args.inputs.configName
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

describe('TestAzureAppConfigurationConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-app-configuration-dev')
  })
})

describe('TestAzureAppConfigurationConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureAppConfigurationConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.appConfiguration).toBeDefined()
  })
})

describe('TestAzureAppConfigurationConstruct', () => {
  test('provisions app configuration as expected', () => {
    pulumi
      .all([
        stack.construct.appConfiguration.id,
        stack.construct.appConfiguration.urn,
        stack.construct.appConfiguration.name,
        stack.construct.appConfiguration.location,
        stack.construct.appConfiguration.sku,
        stack.construct.appConfiguration.tags,
      ])
      .apply(([id, urn, name, location, sku, tags]) => {
        expect(id).toEqual('test-app-configuration-dev-ac-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:appconfiguration:ConfigurationStore::test-app-configuration-dev-ac'
        )
        // expect(name).toEqual('test-app-configuration-dev')
        expect(location).toEqual('eastus')
        expect(sku).toEqual({ name: 'Standard' })
        expect(tags?.environment).toEqual('dev')
      })
  })
})
