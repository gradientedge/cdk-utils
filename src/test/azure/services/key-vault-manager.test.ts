import { KeyVault } from '@cdktf/provider-azurerm/lib/key-vault'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps, KeyVaultProps } from '../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testKeyVault: KeyVaultProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/key-vault.json'],
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
      testKeyVault: this.node.tryGetContext('testKeyVault'),
    }
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)
    this.keyVaultManager.createKeyVault(`test-key-vault-${this.props.stage}`, this, this.props.testKeyVault)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureKeyVaultConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-key-vault-dev')
  })
})

describe('TestAzureKeyVaultConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureKeyVaultConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureKeyVaultConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testKeyVaultDevKeyVaultFriendlyUniqueId: {
        value: 'test-key-vault-dev-kv',
      },
      testKeyVaultDevKeyVaultId: {
        value: '${azurerm_key_vault.test-key-vault-dev-kv.id}',
      },
      testKeyVaultDevKeyVaultName: {
        value: '${azurerm_key_vault.test-key-vault-dev-kv.name}',
      },
    })
  })
})

describe('TestAzureKeyVaultConstruct', () => {
  test('provisions key vault as expected', () => {
    expect(construct).toHaveResourceWithProperties(KeyVault, {
      name: 'test-key-vault-dev',
      resource_group_name: '${data.azurerm_resource_group.test-key-vault-dev-kv-rg.name}',
    })
  })
})
