import { ResourceGroup } from '@cdktf/provider-azurerm/lib/resource-group'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps, ResourceGroupProps } from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testResourceGroup: ResourceGroupProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/resource-group.json'],
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
      testResourceGroup: this.node.tryGetContext('testResourceGroup'),
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
    this.resourceGroupManager.createResourceGroup(
      `test-resource-group-${this.props.stage}`,
      this,
      this.props.testResourceGroup
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureResourceGroupConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-resource-group-dev')
  })
})

describe('TestAzureResourceGroupConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureResourceGroupConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureResourceGroupConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testResourceGroupDevResourceGroupFriendlyUniqueId: {
        value: 'test-resource-group-dev-rg',
      },
      testResourceGroupDevResourceGroupId: {
        value: '${azurerm_resource_group.test-resource-group-dev-rg.id}',
      },
      testResourceGroupDevResourceGroupName: {
        value: '${azurerm_resource_group.test-resource-group-dev-rg.name}',
      },
    })
  })
})

describe('TestAzureResourceGroupConstruct', () => {
  test('provisions resource group as expected', () => {
    expect(construct).toHaveResourceWithProperties(ResourceGroup, {
      name: 'test-resource-group-dev',
      tags: {
        environment: 'dev',
      },
    })
  })
})
