import {
  Api,
  ApiManagementService,
  Backend,
  GetApiManagementServiceResult,
} from '@pulumi/azure-native/apimanagement/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  ApiManagementApiProps,
  ApiManagementBackendProps,
  ApiManagementCustomDomainProps,
  ApiManagementProps,
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ResolveApiManagementProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testApiManagement: ApiManagementProps
  testApiManagementBackend: ApiManagementBackendProps
  testApiManagementApi: ApiManagementApiProps
  testApiManagementCustomDomain: ApiManagementCustomDomainProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/api-management.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
  subscriptionId: 'subscriptionId',
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
    return { ...baseProps, testApiManagement: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  apiManagementService: ApiManagementService
  apiBackend: Backend
  api: Api
  // Note: Custom domain configuration not tested as it should be done via hostnameConfigurations
  // property of ApiManagementService in Pulumi Azure Native
  resolvedApiManagement: pulumi.Output<GetApiManagementServiceResult>

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.apiManagementService = this.apiManagementManager.createApiManagementService(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagement
    )

    this.apiBackend = this.apiManagementManager.createBackend(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagementBackend
    )

    this.api = this.apiManagementManager.createApi(
      `test-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagementApi
    )

    this.resolvedApiManagement = this.apiManagementManager.resolveApiManagementService(
      `test-resolve-api-management-${this.props.stage}`,
      this,
      this.props.testApiManagement as ResolveApiManagementProps
    )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:apimanagement:ApiManagementService') {
      name = args.inputs.serviceName
    } else if (args.type === 'azure-native:apimanagement:Backend') {
      name = args.inputs.backendId
    } else if (args.type === 'azure-native:apimanagement:Api') {
      name = args.inputs.apiId
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

describe('TestAzureApiManagementConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-api-management-dev')
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.apiManagementService).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management as expected', () => {
    pulumi
      .all([
        stack.construct.apiManagementService.id,
        stack.construct.apiManagementService.urn,
        stack.construct.apiManagementService.name,
        stack.construct.apiManagementService.location,
        stack.construct.apiManagementService.sku,
        stack.construct.apiManagementService.tags,
      ])
      .apply(([id, urn, name, location, sku, tags]) => {
        expect(id).toEqual('test-api-management-dev-am-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:apimanagement:ApiManagementService::test-api-management-dev-am'
        )
        expect(name).toEqual('test-api-management-dev')
        expect(location).toEqual('eastus')
        expect(sku).toEqual({ capacity: 1, name: 'Developer' })
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management backend as expected', () => {
    expect(stack.construct.apiBackend).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('provisions api management api operation as expected', () => {
    expect(stack.construct.api).toBeDefined()
  })
})

describe('TestAzureApiManagementConstruct', () => {
  test('api management custom domain throws error as expected', () => {
    // Custom domains should be configured via hostnameConfigurations property
    // of ApiManagementService in Pulumi Azure Native
    expect(() =>
      stack.construct.apiManagementManager.createApiManagementCustomDomain('test-custom-domain', stack.construct, {
        apiManagementId: 'test-id',
        gateway: [{ hostName: 'test.example.com' }],
      })
    ).toThrow('Custom domains should be configured via the hostnameConfigurations property')
  })
})
