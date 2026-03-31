import { ConfigurationStore } from '@pulumi/azure-native/appconfiguration/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  AzureFunctionApp,
  AzureFunctionAppProps,
  AzureLocation,
  CommonAzureStack,
  CommonAzureStackProps,
  FunctionAppProperties,
  StorageAccountProps,
  StorageContainerProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  functionApp: FunctionAppProperties
  dataStorageAccount: StorageAccountProps
  dataStorageContainer: StorageContainerProps
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/config/dummy.json', 'src/test/azure/common/config/function-app.json'],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestFunctionAppConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestFunctionAppConstruct(
      props.name,
      this.props as unknown as AzureFunctionAppProps & TestAzureStackProps
    )
  }
}

class TestFunctionAppConstruct extends AzureFunctionApp {
  declare props: AzureFunctionAppProps & TestAzureStackProps

  constructor(name: string, props: AzureFunctionAppProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
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

    // Return different names based on resource type
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

describe('TestAzureFunctionAppConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureFunctionAppConstruct', () => {
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
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions app service plan as expected', () => {
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:web:AppServicePlan::test-common-stack-app-service-plan-as'
        )
        expect(name).toEqual('test-common-stack-dev')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions app configuration as expected', () => {
    pulumi
      .all([
        (stack.construct.appConfig as ConfigurationStore).id,
        (stack.construct.appConfig as ConfigurationStore).urn,
        (stack.construct.appConfig as ConfigurationStore).name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-app-configuration-ac-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:appconfiguration:ConfigurationStore::test-common-stack-app-configuration-ac'
        )
        expect(name).toEqual('test-app-config-dev')
      })
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions app storage account as expected', () => {
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:StorageAccount::test-common-stack-storage-account-sa'
        )
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions deployment storage container as expected', () => {
    pulumi
      .all([
        stack.construct.appDeploymentStorageContainer.id,
        stack.construct.appDeploymentStorageContainer.urn,
        stack.construct.appDeploymentStorageContainer.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-storage-deployment-container-sc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:BlobContainer::test-common-stack-storage-deployment-container-sc'
        )
        expect(name).toBeDefined()
      })
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions app storage container as expected', () => {
    pulumi
      .all([
        stack.construct.appStorageContainer.id,
        stack.construct.appStorageContainer.urn,
        stack.construct.appStorageContainer.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-storage-container-sc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:BlobContainer::test-common-stack-storage-container-sc'
        )
        expect(name).toBeDefined()
      })
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions data storage account as expected', () => {
    pulumi
      .all([
        stack.construct.dataStorageAccount.id,
        stack.construct.dataStorageAccount.urn,
        stack.construct.dataStorageAccount.name,
        stack.construct.dataStorageAccount.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-data-storage-account-sa-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:StorageAccount::test-common-stack-data-storage-account-sa'
        )
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureFunctionAppConstruct', () => {
  test('provisions data storage container as expected', () => {
    pulumi
      .all([
        stack.construct.dataStorageContainer.id,
        stack.construct.dataStorageContainer.urn,
        stack.construct.dataStorageContainer.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-data-storage-container-sc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:BlobContainer::test-common-stack-data-storage-container-sc'
        )
        expect(name).toBeDefined()
      })
  })
})
