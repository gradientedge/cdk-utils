import { ConfigurationStore } from '@pulumi/azure-native/appconfiguration/index.js'
import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import {
  AzureApiFunction,
  AzureLocation,
  AzureRestApiFunction,
  AzureRestApiFunctionProps,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const baseExtraContexts = [
  'packages/azure/test/common/config/dummy.json',
  'packages/azure/test/common/config/rest-api-function.json',
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
  subscriptionId: 'test-subscription-id',
} as TestAzureStackProps

const testStackPropsNewApi: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/rest-api-function-new.json',
  ],
}

const testStackPropsCors: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/rest-api-function-cors.json',
  ],
}

const testStackPropsCorsSubdomain: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/rest-api-function-cors-subdomain.json',
  ],
}

class TestCommonStack extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiFunctionConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiFunctionConstruct(
      props.name,
      this.props as AzureRestApiFunctionProps & TestAzureStackProps
    )
  }
}

class TestRestApiFunctionConstruct extends AzureRestApiFunction {
  declare props: AzureRestApiFunctionProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiFunctionProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = { apiOperations: {} } as AzureApiFunction
    this.appConnectionStrings = []
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createAppServicePlan()
    this.createAppConfiguration()
    this.createStorageAccount()
    this.createStorageDeploymentContainer()
    this.createStorageContainer()
    this.createCodePackage()
    this.createFunctionApp()
    this.resolveApiKeyVault()
    this.createNamespaceSecret()
    this.createApiManagement()
    this.createApiManagementNamespace()
    this.createApiManagementRoutes()
    this.createCorsPolicy()
  }
}

/** Test class with useExistingApiManagement: false to cover the new API management path */
class TestCommonStackNewApi extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiFunctionNewApiConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiFunctionNewApiConstruct(
      `${props.name}-new-api`,
      this.props as AzureRestApiFunctionProps & TestAzureStackProps
    )
  }
}

class TestRestApiFunctionNewApiConstruct extends AzureRestApiFunction {
  declare props: AzureRestApiFunctionProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiFunctionProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = { apiOperations: {} } as AzureApiFunction
    this.appConnectionStrings = []
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createAppServicePlan()
    this.createAppConfiguration()
    this.createStorageAccount()
    this.createStorageDeploymentContainer()
    this.createStorageContainer()
    this.createCodePackage()
    this.createFunctionApp()
    this.resolveApiKeyVault()
    this.createApiManagement()
    this.createFunctionDashboard()
  }
}

/** Test class with CORS enabled and operations with caching */
class TestCommonStackWithCors extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiFunctionWithCorsConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiFunctionWithCorsConstruct(
      `${props.name}-cors`,
      this.props as AzureRestApiFunctionProps & TestAzureStackProps
    )
  }
}

class TestRestApiFunctionWithCorsConstruct extends AzureRestApiFunction {
  declare props: AzureRestApiFunctionProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiFunctionProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = { apiOperations: {} } as AzureApiFunction
    this.appConnectionStrings = []
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createAppServicePlan()
    this.createAppConfiguration()
    this.createStorageAccount()
    this.createStorageDeploymentContainer()
    this.createStorageContainer()
    this.createCodePackage()
    this.createFunctionApp()
    this.resolveApiKeyVault()
    this.createApiManagement()
    this.createApiManagementRoutes()
    this.createCorsPolicy()
  }
}

/** Test class with CORS using originSubdomain instead of allowedOrigins */
class TestCommonStackWithCorsSubdomain extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiFunctionWithCorsSubdomainConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiFunctionWithCorsSubdomainConstruct(
      `${props.name}-cors-sub`,
      this.props as AzureRestApiFunctionProps & TestAzureStackProps
    )
  }
}

class TestRestApiFunctionWithCorsSubdomainConstruct extends AzureRestApiFunction {
  declare props: AzureRestApiFunctionProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiFunctionProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = { apiOperations: {} } as AzureApiFunction
    this.appConnectionStrings = []
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createAppServicePlan()
    this.createAppConfiguration()
    this.createStorageAccount()
    this.createStorageDeploymentContainer()
    this.createStorageContainer()
    this.createCodePackage()
    this.createFunctionApp()
    this.resolveApiKeyVault()
    this.createApiManagement()
    this.createApiManagementRoutes()
    this.createCorsPolicy()
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
    } else if (args.type === 'azure-native:web:AppServicePlan') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:appconfiguration:ConfigurationStore') {
      name = args.inputs.configStoreName
    } else if (args.type === 'azure-native:storage:StorageAccount') {
      name = args.inputs.accountName
    } else if (args.type === 'azure-native:storage:BlobContainer') {
      name = args.inputs.containerName
    } else if (args.type === 'azure-native:apimanagement:ApiManagementService') {
      name = args.inputs.serviceName
    } else if (args.type === 'azure-native:web:WebApp') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:keyvault:Secret') {
      name = args.inputs.secretName
    } else if (args.type === 'azure-native:apimanagement:NamedValue') {
      name = args.inputs.displayName
    } else if (args.type === 'azure-native:apimanagement:Backend') {
      name = args.name
    } else if (args.type === 'azure-native:apimanagement:Api') {
      name = args.inputs.displayName
    } else if (args.type === 'azure-native:apimanagement:ApiOperation') {
      name = args.inputs.displayName
    } else if (args.type === 'azure-native:apimanagement:Policy') {
      name = args.name
    } else if (args.type === 'azure-native:apimanagement:ApiOperationPolicy') {
      name = args.name
    } else if (args.type === 'azure-native:authorization:RoleAssignment') {
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
    if (args.token === 'azure-native:storage:listStorageAccountKeys') {
      return {
        keys: [{ value: 'mock-storage-key' }],
      }
    }
    if (args.token === 'azure-native:web:listWebAppHostKeys') {
      return {
        functionKeys: { default: 'mock-function-host-key' },
      }
    }
    if (args.token.includes('archive')) {
      return {
        source: args.inputs.sourceDir ?? 'dist',
        outputPath: args.inputs.outputPath ?? 'dist/app.zip',
        outputSize: 1024,
        outputBase64sha256: 'mock-hash',
      }
    }
    if (args.token === 'pulumi:pulumi:StackReference') {
      return {
        apiId: 'mock-api-id',
        apiName: 'mock-api-name',
        apiResourceGroupName: 'mock-api-rg',
      }
    }
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsNewApi.extraContexts))
const stackNewApi = new TestCommonStackNewApi('test-new-api-stack', testStackPropsNewApi)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsCors.extraContexts))
const stackWithCors = new TestCommonStackWithCors('test-cors-stack', testStackPropsCors)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsCorsSubdomain.extraContexts))
const stackWithCorsSubdomain = new TestCommonStackWithCorsSubdomain('test-cors-sub-stack', testStackPropsCorsSubdomain)

describe('TestAzureRestApiFunctionConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.api).toBeDefined()
    expect(stack.construct.appServicePlan).toBeDefined()
    expect(stack.construct.appConfig).toBeDefined()
    expect(stack.construct.appStorageAccount).toBeDefined()
    expect(stack.construct.appDeploymentStorageContainer).toBeDefined()
    expect(stack.construct.appStorageContainer).toBeDefined()
    expect(stack.construct.app).toBeDefined()
    expect(stack.construct.api.authKeyVault).toBeDefined()
    expect(stack.construct.api.namedValueSecret).toBeDefined()
    expect(stack.construct.api.namedValue).toBeDefined()
    expect(stack.construct.api.backend).toBeDefined()
    expect(stack.construct.api.managementApi).toBeDefined()
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('provisions app service plan as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.appServicePlan.id,
          stack.construct.appServicePlan.urn,
          stack.construct.appServicePlan.name,
          stack.construct.appServicePlan.tags,
        ])
        .apply(([id, urn, name, tags]) => {
          expect(id).toEqual('test-common-stack-app-service-plan-as-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:web:AppServicePlan::test-common-stack-app-service-plan-as'
          )
          expect(name).toEqual('test-common-stack-dev')
          expect(tags?.environment).toEqual('dev')
        })
    )
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('provisions app configuration as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          (stack.construct.appConfig as ConfigurationStore).id,
          (stack.construct.appConfig as ConfigurationStore).urn,
          (stack.construct.appConfig as ConfigurationStore).name,
        ])
        .apply(([id, urn, name]) => {
          expect(id).toEqual('test-common-stack-app-configuration-ac-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:appconfiguration:ConfigurationStore::test-common-stack-app-configuration-ac'
          )
          expect(name).toEqual('test-rest-api-func-config-dev')
        })
    )
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('provisions app storage account as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.appStorageAccount.id,
          stack.construct.appStorageAccount.urn,
          stack.construct.appStorageAccount.name,
          stack.construct.appStorageAccount.tags,
        ])
        .apply(([id, urn, name, tags]) => {
          expect(id).toEqual('test-common-stack-storage-account-sa-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:storage:StorageAccount::test-common-stack-storage-account-sa'
          )
          expect(name).toBeDefined()
          expect(tags?.environment).toEqual('dev')
        })
    )
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('provisions deployment storage container as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.appDeploymentStorageContainer.id,
          stack.construct.appDeploymentStorageContainer.urn,
          stack.construct.appDeploymentStorageContainer.name,
        ])
        .apply(([id, urn, name]) => {
          expect(id).toEqual('test-common-stack-storage-deployment-container-sc-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:storage:BlobContainer::test-common-stack-storage-deployment-container-sc'
          )
          expect(name).toBeDefined()
        })
    )
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('resolves api key vault as expected', () => {
    expect(stack.construct.api.authKeyVault).toBeDefined()
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('creates namespace secret as expected', async () => {
    expect(stack.construct.api.namedValueSecret).toBeDefined()
    await outputToPromise(
      pulumi.all([stack.construct.api.namedValueSecret.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('creates api management with existing stack reference as expected', () => {
    expect(stack.construct.api.id).toBeDefined()
    expect(stack.construct.api.name).toBeDefined()
    expect(stack.construct.api.resourceGroupName).toBeDefined()
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('creates api management namespace as expected', () => {
    expect(stack.construct.api.namedValue).toBeDefined()
    expect(stack.construct.api.backend).toBeDefined()
  })
})

describe('TestAzureRestApiFunctionConstruct', () => {
  test('creates api management routes as expected', () => {
    expect(stack.construct.api.managementApi).toBeDefined()
  })
})

describe('TestAzureRestApiFunctionNewApiConstruct', () => {
  test('synthesises new api management as expected', () => {
    expect(stackNewApi).toBeDefined()
    expect(stackNewApi.construct).toBeDefined()
    expect(stackNewApi.construct.api).toBeDefined()
    expect(stackNewApi.construct.api.apim).toBeDefined()
  })
})

describe('TestAzureRestApiFunctionNewApiConstruct', () => {
  test('provisions new api management service as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stackNewApi.construct.api.apim.id,
          stackNewApi.construct.api.apim.urn,
          stackNewApi.construct.api.apim.name,
        ])
        .apply(([id, urn, name]) => {
          expect(id).toBeDefined()
          expect(urn).toBeDefined()
          expect(name).toBeDefined()
        })
    )
  })
})

describe('TestAzureRestApiFunctionWithCorsConstruct', () => {
  test('synthesises with CORS and operations as expected', () => {
    expect(stackWithCors).toBeDefined()
    expect(stackWithCors.construct).toBeDefined()
    expect(stackWithCors.construct.api).toBeDefined()
    expect(stackWithCors.construct.api.corsPolicyXmlContent).toBeDefined()
    expect(stackWithCors.construct.api.corsPolicyXmlContent).toContain('https://example.com')
    expect(stackWithCors.construct.api.corsPolicyXmlContent).toContain('https://test.com')
    expect(stackWithCors.construct.api.corsPolicyXmlContent).toContain('Content-Type')
    expect(stackWithCors.construct.api.corsPolicyXmlContent).toContain('GET')
  })
})

describe('TestAzureRestApiFunctionWithCorsConstruct', () => {
  test('creates api operations as expected', () => {
    expect(stackWithCors.construct.api.apiOperations).toBeDefined()
    expect(stackWithCors.construct.api.apiOperations['GetItems']).toBeDefined()
    expect(stackWithCors.construct.api.apiOperations['PostItems']).toBeDefined()
  })
})

describe('TestAzureRestApiFunctionWithCorsSubdomainConstruct', () => {
  test('synthesises with CORS subdomain as expected', () => {
    expect(stackWithCorsSubdomain).toBeDefined()
    expect(stackWithCorsSubdomain.construct).toBeDefined()
    expect(stackWithCorsSubdomain.construct.api.corsPolicyXmlContent).toBeDefined()
    expect(stackWithCorsSubdomain.construct.api.corsPolicyXmlContent).toContain('app-en')
    expect(stackWithCorsSubdomain.construct.api.corsPolicyXmlContent).toContain('app-fr')
  })
})

/* --- Test for createApiPolicy and dashboardVariables --- */

class TestRestApiFunctionWithPolicyConstruct extends AzureRestApiFunction {
  declare props: AzureRestApiFunctionProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiFunctionProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = { apiOperations: {} } as AzureApiFunction
    this.appConnectionStrings = []
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createAppServicePlan()
    this.createAppConfiguration()
    this.createStorageAccount()
    this.createStorageDeploymentContainer()
    this.createStorageContainer()
    this.createCodePackage()
    this.createFunctionApp()
    this.resolveApiKeyVault()
    this.createNamespaceSecret()
    this.createApiManagement()
    this.createApiManagementNamespace()
    this.createApiManagementRoutes()
    this.createCorsPolicy()
    this.createApiPolicy()
  }

  public getDashboardVars(): Record<string, any> {
    return this.dashboardVariables()
  }
}

class TestCommonStackWithPolicy extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiFunctionWithPolicyConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiFunctionWithPolicyConstruct(
      `${props.name}-policy`,
      this.props as AzureRestApiFunctionProps & TestAzureStackProps
    )
  }
}

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackProps.extraContexts))
const stackWithPolicy = new TestCommonStackWithPolicy('test-policy-stack', testStackProps)

describe('TestAzureRestApiFunctionWithPolicyConstruct', () => {
  test('creates api policy as expected', () => {
    expect(stackWithPolicy).toBeDefined()
    expect(stackWithPolicy.construct).toBeDefined()
    expect(stackWithPolicy.construct.api).toBeDefined()
  })

  test('dashboardVariables returns expected variables', () => {
    const vars = stackWithPolicy.construct.getDashboardVars()
    expect(vars).toBeDefined()
    expect(vars).toHaveProperty('apimName')
    expect(vars).toHaveProperty('functionAppName')
    expect(vars).toHaveProperty('subscriptionId')
  })
})

/* --- Test for full initResources flow --- */

class TestRestApiFunctionFullConstruct extends AzureRestApiFunction {
  declare props: AzureRestApiFunctionProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiFunctionProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = { apiOperations: {} } as AzureApiFunction
    this.appConnectionStrings = []
    this.initResources()
  }
}

class TestCommonStackFull extends CommonAzureStack {
  declare props: CommonAzureStackProps
  declare construct: TestRestApiFunctionFullConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiFunctionFullConstruct(
      `${props.name}-full`,
      this.props as AzureRestApiFunctionProps & TestAzureStackProps
    )
  }
}

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackProps.extraContexts))
const stackFull = new TestCommonStackFull('test-full-raf-stack', testStackProps)

describe('TestAzureRestApiFunctionFullConstruct', () => {
  test('full initResources covers all methods', () => {
    expect(stackFull).toBeDefined()
    expect(stackFull.construct).toBeDefined()
    expect(stackFull.construct.api).toBeDefined()
    expect(stackFull.construct.api.namedValueSecret).toBeDefined()
    expect(stackFull.construct.api.namedValue).toBeDefined()
    expect(stackFull.construct.api.backend).toBeDefined()
    expect(stackFull.construct.api.managementApi).toBeDefined()
  })
})
