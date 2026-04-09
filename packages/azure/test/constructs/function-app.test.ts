import { ConfigurationStore } from '@pulumi/azure-native/appconfiguration/index.js'
import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import {
  AzureFunctionApp,
  AzureFunctionAppProps,
  AzureLocation,
  CommonAzureStack,
  CommonAzureStackProps,
  FunctionAppProperties,
  StorageAccountProps,
  StorageContainerProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  functionApp: FunctionAppProperties
  dataStorageAccount: StorageAccountProps
  dataStorageContainer: StorageContainerProps
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/function-app.json',
  ],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
} as TestAzureStackProps

const testStackPropsOverrides: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/function-app-overrides.json',
  ],
} as TestAzureStackProps

const testStackPropsExistingConfig: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/function-app-existing-config.json',
  ],
} as TestAzureStackProps

const testStackPropsMinimal: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/function-app-minimal.json',
  ],
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: any
  declare construct: TestFunctionAppConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestFunctionAppConstruct(props.name, this.props)
  }
}

class TestFunctionAppConstruct extends AzureFunctionApp {
  declare props: AzureFunctionAppProps & TestAzureStackProps

  constructor(name: string, props: AzureFunctionAppProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
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
    this.createDataStorageAccount()
    this.createDataStorageContainer()
    this.createCodePackage()
    this.createFunctionApp()
    this.createRoleAssignments()
    this.createFunctionDashboard()
  }
}

class TestCommonStackWithOverrides extends CommonAzureStack {
  declare props: any
  declare construct: TestFunctionAppWithOverridesConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackPropsOverrides)
    this.construct = new TestFunctionAppWithOverridesConstruct(`${props.name}-overrides`, this.props)
  }
}

class TestFunctionAppWithOverridesConstruct extends AzureFunctionApp {
  declare props: AzureFunctionAppProps & TestAzureStackProps

  constructor(name: string, props: AzureFunctionAppProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.appConnectionStrings = []
    this.appConfigurationsParsedConfig = { someSetting: 'test-value' }
    this.appConfigurationsOriginalParsedConfig = { appConfig: {} }
    this.appKeyVaultsByResourceGroup = new Map([['test-rg-dev', new Set(['test-keyvault'])]])
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
    this.createDataStorageAccount()
    this.createDataStorageContainer()
    this.generateStorageContainerSas()
    this.createCodePackage()
    this.createFunctionApp()
    this.createRoleAssignments()
    this.createFunctionDashboard()
  }
}

class TestCommonStackWithExistingConfig extends CommonAzureStack {
  declare props: any
  declare construct: TestFunctionAppWithExistingConfigConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackPropsExistingConfig)
    this.construct = new TestFunctionAppWithExistingConfigConstruct(`${props.name}-existing-config`, this.props)
  }
}

class TestFunctionAppWithExistingConfigConstruct extends AzureFunctionApp {
  declare props: AzureFunctionAppProps & TestAzureStackProps

  constructor(name: string, props: AzureFunctionAppProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.appConnectionStrings = []
    this.appConfigurationsParsedConfig = { eventGridTargets: ['target1'] }
    this.appConfigurationsOriginalParsedConfig = { appConfig: {} }
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
    this.createDataStorageAccount()
    this.createDataStorageContainer()
    this.createCodePackage()
    this.createFunctionApp()
    this.createRoleAssignments()
  }
}

class TestCommonStackMinimal extends CommonAzureStack {
  declare props: any
  declare construct: TestFunctionAppMinimalConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackPropsMinimal)
    this.construct = new TestFunctionAppMinimalConstruct(`${props.name}-minimal`, this.props)
  }
}

class TestFunctionAppMinimalConstruct extends AzureFunctionApp {
  declare props: AzureFunctionAppProps & TestAzureStackProps

  constructor(name: string, props: AzureFunctionAppProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
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
    this.createDataStorageAccount()
    this.createDataStorageContainer()
    this.generateStorageContainerSas()
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
    } else if (args.type === 'azure-native:web:WebApp') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:authorization:RoleAssignment') {
      name = args.name
    } else if (args.type === 'azure-native:keyvault:Vault') {
      name = args.inputs.vaultName
    } else if (args.type === 'azure-native:keyvault:Secret') {
      name = args.inputs.secretName
    } else if (args.type === 'azure-native:monitor:DiagnosticSetting') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:portal:Dashboard') {
      name = args.inputs.dashboardName
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'azure-native:storage:listStorageAccountKeys') {
      return { keys: [{ value: 'mock-storage-key' }] }
    }
    if (args.token === 'azure-native:storage:listStorageAccountSAS') {
      return { accountSasToken: 'mock-sas-token' }
    }
    if (args.token.includes('archive')) {
      return {
        source: args.inputs.sourceDir ?? 'dist',
        outputPath: args.inputs.outputPath ?? 'dist/app.zip',
        outputSize: 1024,
        outputBase64sha256: 'mock-hash',
      }
    }
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsOverrides.extraContexts))
const stackWithOverrides = new TestCommonStackWithOverrides('test-overrides-stack', testStackPropsOverrides)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsExistingConfig.extraContexts))
const stackWithExistingConfig = new TestCommonStackWithExistingConfig(
  'test-existing-config-stack',
  testStackPropsExistingConfig
)

pulumi.runtime.setConfig('project:extraContexts', JSON.stringify(testStackPropsMinimal.extraContexts))
const stackMinimal = new TestCommonStackMinimal('test-minimal-stack', testStackPropsMinimal)

describe('TestAzureFunctionAppConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })

  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.appServicePlan).toBeDefined()
    expect(stack.construct.appConfig).toBeDefined()
    expect(stack.construct.appStorageAccount).toBeDefined()
    expect(stack.construct.appDeploymentStorageContainer).toBeDefined()
    expect(stack.construct.appStorageContainer).toBeDefined()
    expect(stack.construct.dataStorageAccount).toBeDefined()
    expect(stack.construct.dataStorageContainer).toBeDefined()
    expect(stack.construct.app).toBeDefined()
    expect(stack.construct.appCodeArchiveFile).toBeDefined()
  })

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
          expect(urn).toBeDefined()
          expect(name).toEqual('test-common-stack-dev')
          expect(tags?.environment).toEqual('dev')
        })
    )
  })

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
          expect(urn).toBeDefined()
          expect(name).toEqual('test-app-config-dev')
        })
    )
  })

  test('provisions app storage account as expected', async () => {
    await outputToPromise(
      pulumi.all([stack.construct.appStorageAccount.id, stack.construct.appStorageAccount.tags]).apply(([id, tags]) => {
        expect(id).toEqual('test-common-stack-storage-account-sa-id')
        expect(tags?.environment).toEqual('dev')
      })
    )
  })

  test('provisions function app as expected', async () => {
    await outputToPromise(
      pulumi.all([stack.construct.app.id, stack.construct.app.urn]).apply(([id, urn]) => {
        expect(id).toBeDefined()
        expect(urn).toBeDefined()
      })
    )
  })
})

describe('TestAzureFunctionAppWithOverridesConstruct', () => {
  test('synthesises with overrides as expected', () => {
    expect(stackWithOverrides).toBeDefined()
    expect(stackWithOverrides.construct).toBeDefined()
    expect(stackWithOverrides.construct.app).toBeDefined()
    expect(stackWithOverrides.construct.functionDashboard).toBeDefined()
    expect(stackWithOverrides.construct.props.useConfigOverride).toEqual(true)
  })

  test('creates function dashboard as expected', async () => {
    await outputToPromise(
      pulumi.all([stackWithOverrides.construct.functionDashboard.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })
})

describe('TestAzureFunctionAppWithExistingConfigConstruct', () => {
  test('synthesises with existing config as expected', () => {
    expect(stackWithExistingConfig).toBeDefined()
    expect(stackWithExistingConfig.construct).toBeDefined()
    expect(stackWithExistingConfig.construct.appConfig).toBeDefined()
    expect(stackWithExistingConfig.construct.app).toBeDefined()
  })
})

describe('TestAzureFunctionAppMinimalConstruct', () => {
  test('synthesises minimal construct as expected', () => {
    expect(stackMinimal).toBeDefined()
    expect(stackMinimal.construct).toBeDefined()
    expect(stackMinimal.construct.appServicePlan).toBeDefined()
    expect(stackMinimal.construct.dataStorageAccount).toBeUndefined()
    expect(stackMinimal.construct.dataStorageContainer).toBeUndefined()
    expect(stackMinimal.construct.appStorageContainer).toBeUndefined()
  })
})
