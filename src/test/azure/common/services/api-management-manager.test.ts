import { ApiManagement } from '@cdktf/provider-azurerm/lib/api-management'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps, ApiManagementProps } from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testApiManagement: ApiManagementProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/api-management.json'],
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
      testApiManagement: this.node.tryGetContext('testApiManagement'),
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
    this.apiManagementtManager.createApiManagement(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagement
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(ApiManagement, {}))

describe('TestAzureApiManagementConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-api-management-dev')
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testApiManagementDevApiManagementFriendlyUniqueId: {
        value: 'test-api-management-dev-am',
      },
      testApiManagementDevApiManagementId: {
        value: '${azurerm_api_management.test-api-management-dev-am.id}',
      },
      testApiManagementDevApiManagementName: {
        value: '${azurerm_api_management.test-api-management-dev-am.name}',
      },
    })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions storage account as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiManagement, {
      name: 'test-api-management-dev',
      resource_group_name: '${data.azurerm_resource_group.test-api-management-dev-am-rg.name}',
    })
  })
})
