import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
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
      testAppConfiguration: this.node.tryGetContext('testAppConfiguration'),
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
    this.appConfigurationManager.createAppConfiguration(
      `test-app-configuration-${this.props.stage}`,
      this,
      this.props.testAppConfiguration
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureAppConfigurationConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-app-configuration-dev')
  })
})

describe('TestAzureAppConfigurationConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureAppConfigurationConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(Testing.toBeValidTerraform(stack)).toBeTruthy()
  })
})

describe('TestAzureAppConfigurationConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testAppConfigurationDevAppConfigurationFriendlyUniqueId: {
        value: 'test-app-configuration-dev-ac',
      },
      testAppConfigurationDevAppConfigurationId: {
        value: '${azurerm_app_configuration.test-app-configuration-dev-ac.id}',
      },
      testAppConfigurationDevAppConfigurationName: {
        value: '${azurerm_app_configuration.test-app-configuration-dev-ac.name}',
      },
    })
  })
})

describe('TestAzureAppConfigurationConstruct', () => {
  test('provisions app configuration as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'AppConfiguration', {
        name: 'test-app-configuration-dev',
        resource_group_name: '${data.azurerm_resource_group.test-app-configuration-dev-ac-rg.name}',
        tags: {
          environment: 'dev',
        },
      })
    )
  })
})
