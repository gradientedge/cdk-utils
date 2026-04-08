import * as pulumi from '@pulumi/pulumi'
import {
  AzureApi,
  AzureLocation,
  AzureRestApi,
  AzureRestApiProps,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const baseExtraContexts = [
  'packages/azure/test/common/config/dummy.json',
  'packages/azure/test/common/config/rest-api.json',
]

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: baseExtraContexts,
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

const testStackPropsNewApi: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/rest-api-new.json',
  ],
}

const testStackPropsNewApiWithCert: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/rest-api-new-with-cert.json',
  ],
}

const testStackPropsNoInsights: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/rest-api-no-insights.json',
  ],
}

/* --- Existing API management variant (useExistingApiManagement: true) --- */

class TestCommonStack extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiConstruct(props.name, this.props as AzureRestApiProps & TestAzureStackProps)
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
    this.createApiManagement()
  }
}

/* --- New API management variant (useExistingApiManagement: false) --- */

class TestCommonStackNewApi extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiNewApiConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiNewApiConstruct(
      `${props.name}-new-api`,
      this.props as AzureRestApiProps & TestAzureStackProps
    )
  }
}

class TestRestApiNewApiConstruct extends AzureRestApi {
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
    this.createApiManagement()
    this.createNamespaceSecretRole()
    this.createNamespaceSecret()
    this.createSubscriptionKeySecret()
    this.createApiManagementLogger()
    this.createApiDiagnostic()
    this.createDiagnosticLog()
  }
}

/* --- New API management with certificate variant (useExistingApiManagement: false, certificateKeyVaultId set) --- */

class TestCommonStackNewApiWithCert extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiNewApiWithCertConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiNewApiWithCertConstruct(
      `${props.name}-new-api-cert`,
      this.props as AzureRestApiProps & TestAzureStackProps
    )
  }
}

class TestRestApiNewApiWithCertConstruct extends AzureRestApi {
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
    this.createApiManagement()
    this.createNamespaceSecretRole()
    this.createNamespaceSecret()
    this.createSubscriptionKeySecret()
    this.createApiManagementLogger()
    this.createApiDiagnostic()
    this.createDiagnosticLog()
  }
}

/* --- No insights variant (no commonApplicationInsights) --- */

class TestCommonStackNoInsights extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiNoInsightsConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiNoInsightsConstruct(
      `${props.name}-no-insights`,
      this.props as AzureRestApiProps & TestAzureStackProps
    )
  }
}

class TestRestApiNoInsightsConstruct extends AzureRestApi {
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
    } else if (args.type === 'azure-native:authorization:RoleAssignment') {
      name = args.name
    } else if (args.type === 'azure-native:keyvault:Secret') {
      name = args.inputs.secretName
    } else if (args.type === 'azure-native:apimanagement:NamedValue') {
      name = args.inputs.displayName
    } else if (args.type === 'azure-native:apimanagement:Logger') {
      name = args.name
    } else if (args.type === 'azure-native:apimanagement:ApiDiagnostic') {
      name = args.name
    } else if (args.type === 'azure-native:monitor:DiagnosticSetting') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:apimanagement:Subscription') {
      name = args.name
    } else if (args.type === 'pulumi:pulumi:StackReference') {
      return {
        id: `${args.name}-id`,
        state: {
          ...args.inputs,
          name: args.name,
          outputs: {
            apiId: 'mock-api-id',
            apiName: 'mock-api-name',
            apiResourceGroupName: 'mock-api-rg',
          },
        },
      }
    }

    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        name,
        identity: { principalId: 'mock-principal-id' },
        primaryKey: 'mock-primary-key',
      },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsNewApi.extraContexts))
const stackNewApi = new TestCommonStackNewApi('test-new-api-stack', testStackPropsNewApi)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsNewApiWithCert.extraContexts))
const stackNewApiWithCert = new TestCommonStackNewApiWithCert('test-new-api-cert-stack', testStackPropsNewApiWithCert)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsNoInsights.extraContexts))
const stackNoInsights = new TestCommonStackNoInsights('test-no-insights-stack', testStackPropsNoInsights)

/* --- Tests for existing API management variant --- */

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
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:resources:ResourceGroup::test-common-stack-rg'
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

describe('TestAzureRestApiConstruct', () => {
  test('creates api management with existing stack reference as expected', () => {
    expect(stack.construct.api.id).toBeDefined()
    expect(stack.construct.api.name).toBeDefined()
    expect(stack.construct.api.resourceGroupName).toBeDefined()
  })
})

/* --- Tests for new API management variant --- */

describe('TestAzureRestApiNewApiConstruct', () => {
  test('synthesises new api management as expected', () => {
    expect(stackNewApi).toBeDefined()
    expect(stackNewApi.construct).toBeDefined()
    expect(stackNewApi.construct.api).toBeDefined()
    expect(stackNewApi.construct.api.apim).toBeDefined()
  })
})

describe('TestAzureRestApiNewApiConstruct', () => {
  test('provisions new api management service as expected', () => {
    pulumi
      .all([stackNewApi.construct.api.apim.id, stackNewApi.construct.api.apim.urn, stackNewApi.construct.api.apim.name])
      .apply(([id, urn, name]) => {
        expect(id).toBeDefined()
        expect(urn).toBeDefined()
        expect(name).toBeDefined()
      })
  })
})

describe('TestAzureRestApiNewApiConstruct', () => {
  test('creates namespace secret role as expected', () => {
    expect(stackNewApi.construct.api.namedValueRoleAssignment).toBeDefined()
    pulumi.all([stackNewApi.construct.api.namedValueRoleAssignment.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })
})

describe('TestAzureRestApiNewApiConstruct', () => {
  test('creates namespace secret as expected', () => {
    expect(stackNewApi.construct.api.namedValueSecret).toBeDefined()
    pulumi.all([stackNewApi.construct.api.namedValueSecret.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })
})

describe('TestAzureRestApiNewApiConstruct', () => {
  test('creates api management logger as expected', () => {
    expect(stackNewApi.construct.api.logger).toBeDefined()
    pulumi.all([stackNewApi.construct.api.logger.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })
})

describe('TestAzureRestApiNewApiConstruct', () => {
  test('resolves application insights as expected', () => {
    expect(stackNewApi.construct.applicationInsights).toBeDefined()
  })
})

describe('TestAzureRestApiNewApiConstruct', () => {
  test('sets api id, name and resourceGroupName from new apim', () => {
    expect(stackNewApi.construct.api.id).toBeDefined()
    expect(stackNewApi.construct.api.name).toBeDefined()
    expect(stackNewApi.construct.api.resourceGroupName).toBeDefined()
  })
})

/* --- Tests for new API management with certificate variant --- */

describe('TestRestApiNewApiWithCertConstruct', () => {
  test('synthesises new api management with certificate as expected', () => {
    expect(stackNewApiWithCert).toBeDefined()
    expect(stackNewApiWithCert.construct).toBeDefined()
    expect(stackNewApiWithCert.construct.api).toBeDefined()
    expect(stackNewApiWithCert.construct.api.apim).toBeDefined()
  })
})

describe('TestRestApiNewApiWithCertConstruct', () => {
  test('provisions api management service as expected', () => {
    pulumi
      .all([
        stackNewApiWithCert.construct.api.apim.id,
        stackNewApiWithCert.construct.api.apim.urn,
        stackNewApiWithCert.construct.api.apim.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toBeDefined()
        expect(urn).toBeDefined()
        expect(name).toBeDefined()
      })
  })
})

/* --- Tests for no insights variant --- */

describe('TestAzureRestApiNoInsightsConstruct', () => {
  test('synthesises without application insights as expected', () => {
    expect(stackNoInsights).toBeDefined()
    expect(stackNoInsights.construct).toBeDefined()
    expect(stackNoInsights.construct.api).toBeDefined()
    expect(stackNoInsights.construct.resourceGroup).toBeDefined()
  })
})

describe('TestAzureRestApiNoInsightsConstruct', () => {
  test('resolves api key vault as expected', () => {
    expect(stackNoInsights.construct.api.authKeyVault).toBeDefined()
  })
})

describe('TestAzureRestApiNoInsightsConstruct', () => {
  test('does not resolve application insights when config is absent', () => {
    expect(stackNoInsights.construct.applicationInsights).toBeUndefined()
  })
})

/* --- Test for useExistingApiManagement early return branches --- */

class TestRestApiExistingFullConstruct extends AzureRestApi {
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
    this.createApiManagement()
    // These should early-return because useExistingApiManagement is true
    this.createNamespaceSecretRole()
    this.createNamespaceSecret()
    this.createSubscriptionKeySecret()
    this.createApiManagementLogger()
    this.createApiDiagnostic()
    this.createDiagnosticLog()
  }
}

class TestCommonStackExistingFull extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiExistingFullConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiExistingFullConstruct(
      `${props.name}-existing-full`,
      this.props as AzureRestApiProps & TestAzureStackProps
    )
  }
}

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackProps.extraContexts))
const stackExistingFull = new TestCommonStackExistingFull('test-existing-full-stack', testStackProps)

describe('TestAzureRestApiExistingFullConstruct', () => {
  test('early returns from methods when useExistingApiManagement is true', () => {
    expect(stackExistingFull).toBeDefined()
    expect(stackExistingFull.construct).toBeDefined()
    expect(stackExistingFull.construct.api).toBeDefined()
    // Verify methods early returned - no namedValueRoleAssignment, namedValueSecret, or logger should be set
    expect(stackExistingFull.construct.api.namedValueRoleAssignment).toBeUndefined()
    expect(stackExistingFull.construct.api.namedValueSecret).toBeUndefined()
    expect(stackExistingFull.construct.api.logger).toBeUndefined()
  })
})

/* --- Test for full initResources flow covering lines 42-52 --- */

class TestRestApiFullConstruct extends AzureRestApi {
  declare props: AzureRestApiProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = {} as AzureApi
    this.initResources()
  }
}

class TestCommonStackFull extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiFullConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiFullConstruct(
      `${props.name}-full`,
      this.props as AzureRestApiProps & TestAzureStackProps
    )
  }
}

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsNewApi.extraContexts))
const stackFull = new TestCommonStackFull('test-full-stack', testStackPropsNewApi)

describe('TestAzureRestApiFullConstruct', () => {
  test('full initResources covers all methods', () => {
    expect(stackFull).toBeDefined()
    expect(stackFull.construct).toBeDefined()
    expect(stackFull.construct.api).toBeDefined()
    expect(stackFull.construct.api.apim).toBeDefined()
    expect(stackFull.construct.api.namedValueRoleAssignment).toBeDefined()
    expect(stackFull.construct.api.namedValueSecret).toBeDefined()
    expect(stackFull.construct.api.logger).toBeDefined()
  })
})
