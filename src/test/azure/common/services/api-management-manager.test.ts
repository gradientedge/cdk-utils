import { ApiManagement } from '@cdktf/provider-azurerm/lib/api-management'
import { ApiManagementApi } from '@cdktf/provider-azurerm/lib/api-management-api'
import { ApiManagementBackend } from '@cdktf/provider-azurerm/lib/api-management-backend'
import { ApiManagementApiOperation } from '@cdktf/provider-azurerm/lib/api-management-api-operation'
import { ApiManagementApiOperationPolicy } from '@cdktf/provider-azurerm/lib/api-management-api-operation-policy'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ApiManagementProps,
  ApiManagementBackendProps,
  ApiManagementApiProps,
} from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testApiManagement: ApiManagementProps
  testApiManagementBackend: ApiManagementBackendProps
  testApiManagementApi: ApiManagementApiProps
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
      testApiManagementBackend: this.node.tryGetContext('testApiManagementBackend'),
      testApiManagementApi: this.node.tryGetContext('testApiManagementApi'),
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
  apiManagement: ApiManagement
  apiManagementBackend: ApiManagementBackend

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)
    this.apiManagement = this.apiManagementManager.createApiManagement(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagement
    )

    this.apiManagementBackend = this.apiManagementManager.createApiManagementBackend(
      `test-api-management-${this.props.stage}`,
      this,
      {
        ...this.props.testApiManagementBackend,
        apiManagementName: this.apiManagement.name,
        resourceGroupName: this.apiManagement.resourceGroupName,
      }
    )

    const policyXmlContent = `<policies>
          <inbound>
              <base />
              <set-backend-service id="apim-generated-policy" backend-id="${this.apiManagementBackend.name}" />
          </inbound>
          <backend>
              <base />
          </backend>
          <outbound>
              <base />
          </outbound>
          <on-error>
              <base />
          </on-error>
        </policies>`

    this.apiManagementManager.createApiManagementApi(`test-api-management-${this.props.stage}`, this, {
      ...this.props.testApiManagementApi,
      apiManagementName: this.apiManagement.name,
      resourceGroupName: this.apiManagement.resourceGroupName,
      policyXmlContent,
    })
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(ApiManagement, {}))
console.log(expect(construct).toHaveResourceWithProperties(ApiManagementApi, {}))
console.log(expect(construct).toHaveResourceWithProperties(ApiManagementBackend, {}))
console.log(expect(construct).toHaveResourceWithProperties(ApiManagementApiOperation, {}))
console.log(expect(construct).toHaveResourceWithProperties(ApiManagementApiOperationPolicy, {}))

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
      testApiManagementDevApiManagementApiFriendlyUniqueId: {
        value: 'test-api-management-dev-am-api',
      },
      testApiManagementDevApiManagementApiId: {
        value: '${azurerm_api_management_api.test-api-management-dev-am-api.id}',
      },
      testApiManagementDevApiManagementApiName: {
        value: '${azurerm_api_management_api.test-api-management-dev-am-api.name}',
      },
      testApiManagementDevTestGetApimOperationPolicyFriendlyUniqueId: {
        value: 'test-api-management-dev-apim-api-operation-policy-test-get',
      },
      testApiManagementDevTestGetApimOperationPolicyId: {
        value:
          '${azurerm_api_management_api_operation_policy.test-api-management-dev-apim-api-operation-policy-test-get.id}',
      },
    })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiManagement, {
      name: 'test-api-management-dev',
      resource_group_name: '${data.azurerm_resource_group.test-api-management-dev-am-rg.name}',
    })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiManagementApi, {
      api_management_name: '${azurerm_api_management.test-api-management-dev-am.name}',
      display_name: 'test-api-management-api',
      name: 'test-api-management-api-dev',
      protocols: ['https'],
      resource_group_name: '${azurerm_api_management.test-api-management-dev-am.resource_group_name}',
      revision: '1',
    })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management backend as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiManagementBackend, {
      api_management_name: '${azurerm_api_management.test-api-management-dev-am.name}',
      description: 'Backend for test-api-management-backend-dev',
      name: 'test-api-management-backend-dev',
      protocol: 'http',
      resource_group_name: '${azurerm_api_management.test-api-management-dev-am.resource_group_name}',
    })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiManagementApiOperation, {
      api_management_name: '${azurerm_api_management_api.test-api-management-dev-am-api.api_management_name}',
      api_name: '${azurerm_api_management_api.test-api-management-dev-am-api.name}',
      display_name: 'test',
      method: 'GET',
      operation_id: 'test-get',
      resource_group_name: '${azurerm_api_management_api.test-api-management-dev-am-api.resource_group_name}',
      url_template: '/test',
    })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiManagementApiOperation, {
      api_management_name: '${azurerm_api_management_api.test-api-management-dev-am-api.api_management_name}',
      api_name: '${azurerm_api_management_api.test-api-management-dev-am-api.name}',
      display_name: 'test',
      method: 'POST',
      operation_id: 'test-post',
      resource_group_name: '${azurerm_api_management_api.test-api-management-dev-am-api.resource_group_name}',
      template_parameter: [
        {
          name: 'path',
          required: true,
          type: '',
        },
      ],
      url_template: '/test/{path}',
    })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApiManagementApiOperationPolicy, {
      api_management_name: '${azurerm_api_management_api.test-api-management-dev-am-api.api_management_name}',
      api_name: '${azurerm_api_management_api.test-api-management-dev-am-api.name}',
      operation_id:
        '${azurerm_api_management_api_operation.test-api-management-dev-apim-api-operation-test-get.operation_id}',
      resource_group_name: '${azurerm_api_management_api.test-api-management-dev-am-api.resource_group_name}',
      xml_content:
        '<policies>\n          <inbound>\n              <base />\n              <set-backend-service id="apim-generated-policy" backend-id="${azurerm_api_management_backend.test-api-management-dev-am-be.name}" />\n          </inbound>\n          <backend>\n              <base />\n          </backend>\n          <outbound>\n              <base />\n          </outbound>\n          <on-error>\n              <base />\n          </on-error>\n        </policies>',
    })
  })
})
