import { StorageAccount } from '@cdktf/provider-azurerm/lib/storage-account'
import { StorageBlob } from '@cdktf/provider-azurerm/lib/storage-blob'
import { StorageContainer } from '@cdktf/provider-azurerm/lib/storage-container'
import { DataAzurermStorageAccountBlobContainerSasPermissions } from '@cdktf/provider-azurerm/lib/data-azurerm-storage-account-blob-container-sas'
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
} from '../../../lib'
import { DataAzurermStorageAccountBlobContainerSas } from '@cdktf/provider-azurerm/lib/data-azurerm-storage-account-blob-container-sas'

interface TestAzureStackProps extends CommonAzureStackProps {
  testStorageAccount: StorageAccountProps
  testStorageContainer: StorageContainerProps
  testStorageBlob: StorageBlobProps
  testAttribute?: string
  testStorageSASTokenPermissions?: DataAzurermStorageAccountBlobContainerSasPermissions
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
      testStorageSASTokenPermissions: this.node.tryGetContext('testStorageSASPermissions'),
    }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)
    this.storageManager.createStorageAccount(
      `test-storage-account-${this.props.stage}`,
      this,
      this.props.testStorageAccount
    )
    this.storageManager.createStorageContainer(
      `test-storage-container-${this.props.stage}`,
      this,
      this.props.testStorageContainer
    )
    this.storageManager.createStorageBlob(`test-storage-blob-${this.props.stage}`, this, this.props.testStorageBlob)

    this.storageManager.generateContainerSasToken(`test-container-sas-token-${this.props.stage}`, this, {
      storageAccountName: this.props.testStorageAccount.name,
      storageContainerName: this.props.testStorageContainer.name,
      resourceGroupName: this.props.testStorageAccount.resourceGroupName ?? 'test-rg-dev',
      permissions: this.props.testStorageSASTokenPermissions,
    })
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureCommonConstruct with custom sas token permissions', () => {
  test('provisions container SAS token as expected', () => {
    expect(construct).toHaveDataSourceWithProperties(DataAzurermStorageAccountBlobContainerSas, {
      container_name: 'test-storage-container',
      https_only: true,
      permissions: {
        read: true,
        add: false,
        create: false,
        delete: false,
        list: false,
        write: false,
      },
    })
  })
})
