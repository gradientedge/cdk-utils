import { StorageAccount } from '@cdktf/provider-azurerm/lib/storage-account'
import { StorageBlob } from '@cdktf/provider-azurerm/lib/storage-blob'
import { StorageContainer } from '@cdktf/provider-azurerm/lib/storage-container'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  StorageAccountProps,
  StorageBlobProps,
  StorageContainerProps,
  DataAzurermStorageAccountBlobContainerSasProps,
} from '../../../lib'
import { DataAzurermStorageAccountBlobContainerSas } from '@cdktf/provider-azurerm/lib/data-azurerm-storage-account-blob-container-sas'

interface TestAzureStackProps extends CommonAzureStackProps {
  testStorageAccount: StorageAccountProps
  testStorageContainer: StorageContainerProps
  testStorageBlob: StorageBlobProps
  testContainerSas: DataAzurermStorageAccountBlobContainerSasProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/storage.json'],
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
      testStorageAccount: this.node.tryGetContext('testStorageAccount'),
      testStorageBlob: this.node.tryGetContext('testStorageBlob'),
      testStorageContainer: this.node.tryGetContext('testStorageContainer'),
      testContainerSas: this.node.tryGetContext('testContainerSas'),
    }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)
    const storageAccount = this.storageManager.createStorageAccount(
      `test-storage-account-${this.props.stage}`,
      this,
      this.props.testStorageAccount
    )
    const storageContainer = this.storageManager.createStorageContainer(
      `test-storage-container-${this.props.stage}`,
      this,
      this.props.testStorageContainer
    )
    this.storageManager.createStorageBlob(`test-storage-blob-${this.props.stage}`, this, this.props.testStorageBlob)

    this.storageManager.generateContainerSasToken(
      `test-container-sas-token-${this.props.stage}`,
      this,
      this.props.testContainerSas,
      storageAccount,
      storageContainer
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureCommonConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureCommonConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureCommonConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testStorageAccountDevStorageAccountFriendlyUniqueId: {
        value: 'test-storage-account-dev-sa',
      },
      testStorageAccountDevStorageAccountId: {
        value: '${azurerm_storage_account.test-storage-account-dev-sa.id}',
      },
      testStorageAccountDevStorageAccountName: {
        value: '${azurerm_storage_account.test-storage-account-dev-sa.name}',
      },
      testStorageBlobDevStorageBlobFriendlyUniqueId: {
        value: 'test-storage-blob-dev-sb',
      },
      testStorageBlobDevStorageBlobId: {
        value: '${azurerm_storage_blob.test-storage-blob-dev-sb.id}',
      },
      testStorageBlobDevStorageBlobName: {
        value: '${azurerm_storage_blob.test-storage-blob-dev-sb.name}',
      },
      testStorageContainerDevStorageContainerFriendlyUniqueId: {
        value: 'test-storage-container-dev-sc',
      },
      testStorageContainerDevStorageContainerId: {
        value: '${azurerm_storage_container.test-storage-container-dev-sc.id}',
      },
      testStorageContainerDevStorageContainerName: {
        value: '${azurerm_storage_container.test-storage-container-dev-sc.name}',
      },
    })
  })
})

describe('TestAzureCommonConstruct', () => {
  test('provisions data as expected', () => {
    expect(JSON.parse(construct).data).toMatchObject({
      azurerm_resource_group: {
        'test-storage-account-dev-sa-rg': {
          name: 'test-rg-dev',
        },
        'test-storage-blob-dev-sb-rg': {
          name: 'test-rg-dev',
        },
      },
      azurerm_storage_account: {
        'test-storage-blob-dev-sa': {
          name: 'test-storage-account-dev',
          resource_group_name: '${data.azurerm_resource_group.test-storage-blob-dev-sb-rg.name}',
        },
      },
      azurerm_storage_container: {
        'test-storage-blob-dev-sc': {
          name: 'test-storage-container-dev',
        },
      },
    })
  })
})

describe('TestAzureCommonConstruct', () => {
  test('provisions storage account as expected', () => {
    expect(construct).toHaveResourceWithProperties(StorageAccount, {
      account_tier: 'Standard',
      location: '${data.azurerm_resource_group.test-storage-account-dev-sa-rg.location}',
      name: 'teststorageaccountdev',
      resource_group_name: '${data.azurerm_resource_group.test-storage-account-dev-sa-rg.name}',
      tags: {
        environment: 'dev',
      },
    })
  })
})

describe('TestAzureCommonConstruct', () => {
  test('provisions storage container as expected', () => {
    expect(construct).toHaveResourceWithProperties(StorageContainer, {
      name: 'test-storage-container-dev',
      storage_account_name: 'test-storage-account',
    })
  })
})

describe('TestAzureCommonConstruct', () => {
  test('provisions storage blob as expected', () => {
    expect(construct).toHaveResourceWithProperties(StorageBlob, {
      name: 'test-storage-blob-dev',
      storage_account_name: '${data.azurerm_storage_account.test-storage-blob-dev-sa.name}',
      storage_container_name: '${data.azurerm_storage_container.test-storage-blob-dev-sc.name}',
    })
  })
})

describe('TestAzureCommonConstruct', () => {
  test('provisions SAS output as expected', () => {
    expect(JSON.parse(construct).output).toHaveProperty('testContainerSasTokenDevSasToken')
  })
})

describe('TestAzureCommonConstruct', () => {
  test('provisions container SAS token as expected', () => {
    expect(construct).toHaveDataSourceWithProperties(DataAzurermStorageAccountBlobContainerSas, {
      connection_string: '${azurerm_storage_account.test-storage-account-dev-sa.primary_connection_string}',
      container_name: '${azurerm_storage_container.test-storage-container-dev-sc.name}',
      expiry: '2040-12-31',
      https_only: true,
      permissions: {
        add: true,
        create: true,
        delete: true,
        list: true,
        read: true,
        write: true,
      },
      start: expect.any(String),
    })
  })
})
