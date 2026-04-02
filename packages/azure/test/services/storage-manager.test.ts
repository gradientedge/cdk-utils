import { Blob, BlobContainer, StorageAccount } from '@pulumi/azure-native/storage/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ContainerSasTokenProps,
  StorageAccountProps,
  StorageBlobProps,
  StorageContainerProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testStorageAccount: StorageAccountProps
  testStorageContainer: StorageContainerProps
  testStorageBlob: StorageBlobProps
  testContainerSas: ContainerSasTokenProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/storage.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  storageAccount: StorageAccount
  storageContainer: BlobContainer
  storageBlob: Blob
  sasToken: pulumi.Output<string>

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.storageAccount = this.storageManager.createStorageAccount(
      `test-storage-account-${this.props.stage}`,
      this,
      this.props.testStorageAccount
    )
    this.storageContainer = this.storageManager.createStorageContainer(
      `test-storage-container-${this.props.stage}`,
      this,
      this.props.testStorageContainer
    )
    this.storageBlob = this.storageManager.createStorageBlob(
      `test-storage-blob-${this.props.stage}`,
      this,
      this.props.testStorageBlob
    )

    this.sasToken = this.storageManager.generateContainerSasToken(
      `test-container-sas-token-${this.props.stage}`,
      this,
      this.props.testContainerSas,
      this.storageAccount
    )
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:storage:StorageAccount') {
      name = args.inputs.accountName
    } else if (args.type === 'azure-native:storage:BlobContainer') {
      name = args.inputs.containerName
    } else if (args.type === 'azure-native:storage:Blob') {
      name = args.inputs.blobName
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock SAS token generation
    if (args.token === 'azure-native:storage:listStorageAccountSAS') {
      return {
        accountSasToken: 'mock-sas-token-value',
      }
    }
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureStorageConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureStorageConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.storageAccount).toBeDefined()
    expect(stack.construct.storageContainer).toBeDefined()
    expect(stack.construct.storageBlob).toBeDefined()
  })
})

describe('TestAzureStorageConstruct', () => {
  test('provisions storage account as expected', () => {
    pulumi
      .all([
        stack.construct.storageAccount.id,
        stack.construct.storageAccount.urn,
        stack.construct.storageAccount.name,
        stack.construct.storageAccount.location,
        stack.construct.storageAccount.sku,
        stack.construct.storageAccount.tags,
      ])
      .apply(([id, urn, name, location, sku, tags]) => {
        expect(id).toEqual('test-storage-account-dev-sa-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:StorageAccount::test-storage-account-dev-sa'
        )
        expect(name).toEqual('teststorageaccountdev')
        expect(location).toEqual('eastus')
        expect(sku).toEqual({ name: 'Standard_LRS' })
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureStorageConstruct', () => {
  test('provisions storage container as expected', () => {
    pulumi
      .all([
        stack.construct.storageContainer.id,
        stack.construct.storageContainer.urn,
        stack.construct.storageContainer.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-storage-container-dev-sc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:BlobContainer::test-storage-container-dev-sc'
        )
        expect(name).toEqual('test-storage-container-dev')
      })
  })
})

describe('TestAzureStorageConstruct', () => {
  test('provisions storage blob as expected', () => {
    pulumi
      .all([stack.construct.storageBlob.id, stack.construct.storageBlob.urn, stack.construct.storageBlob.name])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-storage-blob-dev-sb-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:Blob::test-storage-blob-dev-sb'
        )
        expect(name).toEqual('test-storage-blob-dev')
      })
  })
})

describe('TestAzureStorageConstruct', () => {
  test('provisions container SAS token as expected', () => {
    pulumi.all([stack.construct.sasToken]).apply(([token]) => {
      expect(token).toEqual('mock-sas-token-value')
    })
  })
})

/* --- Tests for default value fallback branches --- */

class TestMinimalStorageConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  storageAccount: StorageAccount

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    // StorageAccount with minimal props - exercises sku/kind/location/tags/allowBlobPublicAccess/deleteRetentionPolicy defaults
    this.storageAccount = this.storageManager.createStorageAccount(`test-minimal-storage-${this.props.stage}`, this, {
      accountName: 'test-minimal-storage',
      resourceGroupName: 'test-rg-dev',
    } as any)
  }
}

class TestMinimalStorageStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalStorageConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalStorageConstruct(props.name, this.props)
  }
}

const minimalStorageStack = new TestMinimalStorageStack('test-minimal-storage-stack', testStackProps)

describe('TestAzureStorageConstruct - Default Values', () => {
  test('storage account uses default sku when not provided', () => {
    pulumi.all([minimalStorageStack.construct.storageAccount.sku]).apply(([sku]) => {
      expect(sku?.name).toEqual('Standard_LRS')
    })
  })

  test('storage account uses default kind when not provided', () => {
    pulumi.all([minimalStorageStack.construct.storageAccount.kind]).apply(([kind]) => {
      expect(kind).toEqual('StorageV2')
    })
  })

  test('storage account uses default location from scope when not provided', () => {
    pulumi.all([minimalStorageStack.construct.storageAccount.location]).apply(([location]) => {
      expect(location).toEqual('eastus')
    })
  })

  test('storage account uses default tags when not provided', () => {
    pulumi.all([minimalStorageStack.construct.storageAccount.tags]).apply(([tags]) => {
      expect(tags?.environment).toEqual('dev')
    })
  })

  test('storage account uses default allowBlobPublicAccess when not provided', () => {
    pulumi
      .all([minimalStorageStack.construct.storageAccount.allowBlobPublicAccess])
      .apply(([allowBlobPublicAccess]) => {
        expect(allowBlobPublicAccess).toEqual(false)
      })
  })
})

describe('TestAzureStorageConstruct - Error Handling', () => {
  test('createManagementPolicy throws when props are undefined', () => {
    expect(() => {
      minimalStorageStack.construct.storageManager.createManagementPolicy(
        'test-mp-err',
        minimalStorageStack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-mp-err')
  })

  test('createTable throws when props are undefined', () => {
    expect(() => {
      minimalStorageStack.construct.storageManager.createTable(
        'test-table-err',
        minimalStorageStack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-table-err')
  })
})

/* --- Tests for createManagementPolicy and createTable --- */

import { ManagementPolicy, Table } from '@pulumi/azure-native/storage/index.js'
import { ManagementPolicyProps, StorageTableProps } from '../../src/index.js'

class TestConstructWithMgmtPolicy extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  storageAccount: StorageAccount
  managementPolicy: ManagementPolicy
  storageTable: Table

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.storageAccount = this.storageManager.createStorageAccount(
      `test-storage-mp-${this.props.stage}`,
      this,
      this.props.testStorageAccount
    )
    this.managementPolicy = this.storageManager.createManagementPolicy(`test-mp-${this.props.stage}`, this, {
      accountName: this.storageAccount.name,
      resourceGroupName: 'test-rg-dev',
      managementPolicyName: 'default',
      policy: {
        rules: [],
      },
    } as ManagementPolicyProps)
    this.storageTable = this.storageManager.createTable(`test-table-${this.props.stage}`, this, {
      tableName: 'testTable',
      accountName: this.storageAccount.name,
      resourceGroupName: 'test-rg-dev',
    } as StorageTableProps)
  }
}

class TestStackWithMgmtPolicy extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithMgmtPolicy

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithMgmtPolicy(props.name, this.props)
  }
}

const stackWithMgmtPolicy = new TestStackWithMgmtPolicy('test-mgmt-policy-stack', testStackProps)

describe('TestAzureStorageConstruct - ManagementPolicy and Table', () => {
  test('provisions management policy as expected', () => {
    expect(stackWithMgmtPolicy.construct.managementPolicy).toBeDefined()
    pulumi.all([stackWithMgmtPolicy.construct.managementPolicy.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })

  test('provisions storage table as expected', () => {
    expect(stackWithMgmtPolicy.construct.storageTable).toBeDefined()
    pulumi.all([stackWithMgmtPolicy.construct.storageTable.id]).apply(([id]) => {
      expect(id).toBeDefined()
    })
  })
})
