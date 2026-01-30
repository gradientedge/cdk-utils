import { Blob, BlobContainer, StorageAccount } from '@pulumi/azure-native/storage/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  StorageAccountProps,
  StorageBlobProps,
  StorageContainerProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testStorageAccount: StorageAccountProps
  testStorageContainer: StorageContainerProps
  testStorageBlob: StorageBlobProps
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
  stageContextPath: 'src/test/azure/common/pulumiEnv',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  storageAccount: StorageAccount
  storageContainer: BlobContainer
  storageBlob: Blob

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
  }
}

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
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureCommonConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureCommonConstruct', () => {
  expect(stack.construct.storageAccount).toBeDefined()
  test('provisions storage account as expected', () => {
    pulumi
      .all([
        stack.construct.storageAccount.id,
        stack.construct.storageAccount.name,
        stack.construct.storageAccount.location,
        stack.construct.storageAccount.tags,
      ])
      .apply(([id, name, location, tags]) => {
        expect(id).toEqual('test-storage-account-dev-sa-id')
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureCommonConstruct', () => {
  expect(stack.construct.storageContainer).toBeDefined()
  test('provisions storage container as expected', () => {
    pulumi.all([stack.construct.storageContainer.id, stack.construct.storageContainer.name]).apply(([id, name]) => {
      expect(id).toEqual('test-storage-container-dev-sc-id')
      expect(name).toBeDefined()
    })
  })
})

describe('TestAzureCommonConstruct', () => {
  expect(stack.construct.storageBlob).toBeDefined()
  test('provisions storage blob as expected', () => {
    pulumi.all([stack.construct.storageBlob.id, stack.construct.storageBlob.name]).apply(([id, name]) => {
      expect(id).toEqual('test-storage-blob-dev-sb-id')
      expect(name).toBeDefined()
    })
  })
})

describe('TestAzureCommonConstruct - Stage Utilities', () => {
  test('isDevelopmentStage returns true for dev stage', () => {
    expect(stack.construct.isDevelopmentStage()).toBe(true)
  })

  test('isTestStage returns false for dev stage', () => {
    expect(stack.construct.isTestStage()).toBe(false)
  })

  test('isUatStage returns false for dev stage', () => {
    expect(stack.construct.isUatStage()).toBe(false)
  })

  test('isProductionStage returns false for dev stage', () => {
    expect(stack.construct.isProductionStage()).toBe(false)
  })

  test('fullyQualifiedDomainName is set correctly without subDomain', () => {
    expect(stack.construct.fullyQualifiedDomainName).toBe('gradientedge.io')
  })

  test('fullyQualifiedDomainName is set correctly with subDomain', () => {
    const stackWithSubdomain = new TestCommonStack('test-stack-subdomain', {
      ...testStackProps,
      subDomain: 'test',
    })
    expect(stackWithSubdomain.construct.fullyQualifiedDomainName).toBe('test.gradientedge.io')
  })
})

describe('TestAzureCommonConstruct - Different Stages', () => {
  test('isTestStage returns true for tst stage', () => {
    const testStack = new TestCommonStack('test-stack-tst', {
      ...testStackProps,
      stage: 'tst',
    })
    expect(testStack.construct.isTestStage()).toBe(true)
    expect(testStack.construct.isDevelopmentStage()).toBe(false)
  })

  test('isUatStage returns true for uat stage', () => {
    const uatStack = new TestCommonStack('test-stack-uat', {
      ...testStackProps,
      stage: 'uat',
    })
    expect(uatStack.construct.isUatStage()).toBe(true)
    expect(uatStack.construct.isDevelopmentStage()).toBe(false)
  })

  test('isProductionStage returns true for prd stage', () => {
    const prdStack = new TestCommonStack('test-stack-prd', {
      ...testStackProps,
      stage: 'prd',
    })
    expect(prdStack.construct.isProductionStage()).toBe(true)
    expect(prdStack.construct.isDevelopmentStage()).toBe(false)
  })
})
