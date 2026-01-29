import { Vault } from '@pulumi/azure-native/keyvault/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  KeyVaultProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testKeyVault: KeyVaultProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/key-vault.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
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
    // Override the test property to undefined to trigger validation error
    return { ...baseProps, testKeyVault: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  keyVault: Vault

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.keyVault = this.keyVaultManager.createKeyVault(
      `test-key-vault-${this.props.stage}`,
      this,
      this.props.testKeyVault
    )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    if (args.type === 'azure-native:keyvault:Vault') {
      name = args.inputs.vaultName
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

describe('TestAzureKeyVaultConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-key-vault-dev')
  })
})

describe('TestAzureKeyVaultConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureKeyVaultConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.keyVault).toBeDefined()
  })
})

describe('TestAzureKeyVaultConstruct', () => {
  test('provisions key vault as expected', () => {
    pulumi
      .all([
        stack.construct.keyVault.id,
        stack.construct.keyVault.urn,
        stack.construct.keyVault.name,
        stack.construct.keyVault.location,
        stack.construct.keyVault.properties,
        stack.construct.keyVault.tags,
      ])
      .apply(([id, urn, name, location, properties, tags]) => {
        expect(id).toEqual('test-key-vault-dev-kv-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:keyvault:Vault::test-key-vault-dev-kv'
        )
        expect(name).toEqual('test-key-vault-dev')
        expect(location).toEqual('eastus')
        expect(properties).toEqual({
          enablePurgeProtection: true,
          enableRbacAuthorization: true,
          enableSoftDelete: true,
          enabledForDeployment: false,
          enabledForDiskEncryption: false,
          enabledForTemplateDeployment: false,
          publicNetworkAccess: 'enabled',
          sku: { family: 'A', name: 'standard' },
          softDeleteRetentionInDays: 90,
          tenantId: '00000000-0000-0000-0000-000000000000',
        })
        expect(tags?.environment).toEqual('dev')
      })
  })
})
