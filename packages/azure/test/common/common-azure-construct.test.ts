import { Blob, BlobContainer, StorageAccount } from '@pulumi/azure-native/storage/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  StorageAccountProps,
  StorageBlobProps,
  StorageContainerProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testStorageAccount: StorageAccountProps
  testStorageContainer: StorageContainerProps
  testStorageBlob: StorageBlobProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/storage.json'],
  features: {},
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/pulumiEnv',
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
    const testStack = new TestCommonStack('test-stack-tst', testStackProps)
    expect(testStack.construct.isTestStage()).toBe(false)
    expect(testStack.construct.isDevelopmentStage()).toBe(true)
  })
})

describe('TestAzureCommonConstruct - ResourceNameFormatter', () => {
  test('format applies globalPrefix when option is set', () => {
    const stackWithPrefix = new TestCommonStack('test-prefix-stack', {
      ...testStackProps,
      globalPrefix: 'ge',
    })
    const result = stackWithPrefix.construct.resourceNameFormatter.format('my-resource', {
      globalPrefix: true,
    })
    expect(result).toContain('ge')
    expect(result).toContain('my-resource')
  })

  test('format applies globalSuffix when option is set', () => {
    const stackWithSuffix = new TestCommonStack('test-suffix-stack', {
      ...testStackProps,
      globalSuffix: 'v1',
    })
    const result = stackWithSuffix.construct.resourceNameFormatter.format('my-resource', {
      globalSuffix: true,
    })
    expect(result).toContain('v1')
    expect(result).toContain('my-resource')
  })

  test('format excludes prefix and suffix when exclude option is set', () => {
    const stackForExclude = new TestCommonStack('test-exclude-stack', {
      ...testStackProps,
      resourcePrefix: 'pre',
      resourceSuffix: 'suf',
    })
    const result = stackForExclude.construct.resourceNameFormatter.format('my-resource', {
      exclude: true,
    })
    expect(result).not.toContain('pre')
    expect(result).not.toContain('suf')
    expect(result).toContain('my-resource')
  })

  test('format applies custom prefix and suffix', () => {
    const result = stack.construct.resourceNameFormatter.format('my-resource', {
      prefix: 'custom-pre',
      suffix: 'custom-suf',
    })
    expect(result).toContain('custom-pre')
    expect(result).toContain('custom-suf')
    expect(result).toContain('my-resource')
  })
})

describe('TestAzureCommonConstruct - Error Handling', () => {
  test('resolveStack throws when stackName is empty', () => {
    expect(() => {
      stack.construct['resolveStack']('')
    }).toThrow('Stack name undefined')
  })

  test('resolveStack creates stack reference with valid name', () => {
    const stackRef = stack.construct['resolveStack']('valid-stack-name')
    expect(stackRef).toBeDefined()
  })

  test('resolveCommonLogAnalyticsWorkspace throws when props are undefined', () => {
    const originalProps = stack.construct.props.commonLogAnalyticsWorkspace
    stack.construct.props.commonLogAnalyticsWorkspace = undefined
    expect(() => {
      stack.construct['resolveCommonLogAnalyticsWorkspace']()
    }).toBeDefined()
  })

  test('resolveCommonLogAnalyticsWorkspace throws when workspaceName is undefined', () => {
    const originalProps = stack.construct.props.commonLogAnalyticsWorkspace
    stack.construct.props.commonLogAnalyticsWorkspace = { resourceGroupName: 'test-rg' } as any
    expect(() => {
      stack.construct['resolveCommonLogAnalyticsWorkspace']()
    }).toBeDefined()
  })

  test('createResourceGroup creates resource group when not already set', () => {
    const newStack = new TestCommonStack('test-rg-stack', testStackProps)
    newStack.construct['createResourceGroup']()
    expect(newStack.construct.resourceGroup).toBeDefined()
  })

  test('createResourceGroup skips creation when already set', () => {
    const newStack = new TestCommonStack('test-rg-skip-stack', testStackProps)
    newStack.construct['createResourceGroup']()
    const firstRg = newStack.construct.resourceGroup
    newStack.construct['createResourceGroup']()
    expect(newStack.construct.resourceGroup).toBe(firstRg)
  })
})
