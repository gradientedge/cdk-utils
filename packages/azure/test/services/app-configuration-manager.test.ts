import { ConfigurationStore } from '@pulumi/azure-native/appconfiguration/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  AppConfigurationProps,
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAppConfiguration: AppConfigurationProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/app-configuration.json',
  ],
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

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

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
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:appconfiguration:ConfigurationStore::test-app-configuration-dev-ac'
        )
        // expect(name).toEqual('test-app-configuration-dev')
        expect(location).toEqual('eastus')
        expect(sku).toEqual({ name: 'Standard' })
        expect(tags?.environment).toEqual('dev')
      })
  })
})

/* --- Tests for resource group name fallback and static methods --- */

import { AzureAppConfigurationManager } from '../../src/index.js'

describe('TestAzureAppConfigurationConstruct - Resource Group Fallback', () => {
  test('createConfigurationStore throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgAppConfigConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.appConfigurationManager.createConfigurationStore('test-no-rg-ac', this, {
            configStoreName: 'test-no-rg-ac',
          } as any)
        }
      }
      class NoRgAppConfigStack extends CommonAzureStack {
        constructor(name: string, props: any) {
          super(name, { ...testStackProps, resourceGroupName: undefined })
          new NoRgAppConfigConstruct(props.name, this.props)
        }
      }
      new NoRgAppConfigStack('test-no-rg-ac-stack', testStackProps)
    }).toThrow('Resource group name undefined for test-no-rg-ac')
  })
})

describe('AzureAppConfigurationManager - Static Methods', () => {
  test('hasCosmosDependencies returns false for null/undefined', () => {
    expect(AzureAppConfigurationManager.hasCosmosDependencies(null)).toBe(false)
    expect(AzureAppConfigurationManager.hasCosmosDependencies(undefined)).toBe(false)
    expect(AzureAppConfigurationManager.hasCosmosDependencies('string')).toBe(false)
  })

  test('hasCosmosDependencies returns true when databaseName is present', () => {
    expect(AzureAppConfigurationManager.hasCosmosDependencies({ databaseName: 'mydb' })).toBe(true)
  })

  test('hasCosmosDependencies returns true when tableName is present', () => {
    expect(AzureAppConfigurationManager.hasCosmosDependencies({ tableName: 'mytable' })).toBe(true)
  })

  test('hasCosmosDependencies returns true for nested objects with cosmos dependencies', () => {
    expect(AzureAppConfigurationManager.hasCosmosDependencies({ nested: { databaseName: 'mydb' } })).toBe(true)
  })

  test('hasCosmosDependencies returns false for nested objects without cosmos dependencies', () => {
    expect(AzureAppConfigurationManager.hasCosmosDependencies({ nested: { key: 'value' } })).toBe(false)
  })

  test('hasEventGridTargets returns true when eventGridTargets is present', () => {
    expect(AzureAppConfigurationManager.hasEventGridTargets({ eventGridTargets: [] })).toBe(true)
  })

  test('hasEventGridTargets returns falsy for null/undefined', () => {
    expect(AzureAppConfigurationManager.hasEventGridTargets(null)).toBeFalsy()
    expect(AzureAppConfigurationManager.hasEventGridTargets(undefined)).toBeFalsy()
  })

  test('hasEventGridTargets returns falsy for non-object', () => {
    expect(AzureAppConfigurationManager.hasEventGridTargets('string')).toBeFalsy()
  })
})
