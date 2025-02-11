import { LinuxFunctionApp } from '@cdktf/provider-azurerm/lib/linux-function-app'
import { FunctionAppFunction } from '@cdktf/provider-azurerm/lib/function-app-function'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  FunctionAppProps,
  FunctionProps,
} from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testFunctionApp: FunctionAppProps
  testFunction: FunctionProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/functions.json'],
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
      testFunctionApp: this.node.tryGetContext('testFunctionApp'),
      testFunction: this.node.tryGetContext('testFunction'),
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
    this.functiontManager.createFunctionApp(`test-function-app-${this.props.stage}`, this, this.props.testFunctionApp)
    this.functiontManager.createFunction(`test-function-${this.props.stage}`, this, this.props.testFunction)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureFunctionAppConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-function-app-dev')
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testFunctionAppDevFunctionAppFriendlyUniqueId: {
        value: 'test-function-app-dev-fa',
      },
      testFunctionAppDevFunctionAppId: {
        value: '${azurerm_linux_function_app.test-function-app-dev-fa.id}',
      },
      testFunctionAppDevFunctionAppName: {
        value: '${azurerm_linux_function_app.test-function-app-dev-fa.name}',
      },
      testFunctionDevFunctionFriendlyUniqueId: {
        value: 'test-function-dev-fc',
      },
      testFunctionDevFunctionId: {
        value: '${azurerm_function_app_function.test-function-dev-fc.id}',
      },
      testFunctionDevFunctionName: {
        value: '${azurerm_function_app_function.test-function-dev-fc.name}',
      },
    })
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions function app as expected', () => {
    expect(construct).toHaveResourceWithProperties(LinuxFunctionApp, {
      name: 'test-function-app-dev',
      resource_group_name: '${data.azurerm_resource_group.test-function-app-dev-fa-rg.name}',
    })
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('provisions function as expected', () => {
    expect(construct).toHaveResourceWithProperties(FunctionAppFunction, {
      name: 'test-function-dev',
    })
  })
})
