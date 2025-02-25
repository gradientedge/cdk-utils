import { LogAnalyticsWorkspace } from '@cdktf/provider-azurerm/lib/log-analytics-workspace'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  LogAnalyticsWorkspaceProps,
} from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testLogAnalyticsWorkspace: LogAnalyticsWorkspaceProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/azure/common/cdkConfig/dummy.json',
    'src/test/azure/common/cdkConfig/log-analytics-workspace.json',
  ],
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
      testLogAnalyticsWorkspace: this.node.tryGetContext('testLogAnalyticsWorkspace'),
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
    this.logAnalyticsWorkspaceManager.createLogAnalyticsWorkspace(
      `test-log-analytics-workspace-${this.props.stage}`,
      this,
      this.props.testLogAnalyticsWorkspace
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(LogAnalyticsWorkspace, {}))

describe('TestAzureLogAnalyticsWorkspaceConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-log-analytics-workspace-dev')
  })
})

describe('TestAzureLogAnalyticsWorkspaceConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureLogAnalyticsWorkspaceConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureLogAnalyticsWorkspaceConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testLogAnalyticsWorkspaceDevLogAnalyticsWorkspaceFriendlyUniqueId: {
        value: 'test-log-analytics-workspace-dev-lw',
      },
      testLogAnalyticsWorkspaceDevLogAnalyticsWorkspaceId: {
        value: '${azurerm_log_analytics_workspace.test-log-analytics-workspace-dev-lw.id}',
      },
      testLogAnalyticsWorkspaceDevLogAnalyticsWorkspaceName: {
        value: '${azurerm_log_analytics_workspace.test-log-analytics-workspace-dev-lw.name}',
      },
    })
  })
})

describe('TestAzureLogAnalyticsWorkspaceConstruct', () => {
  test('provisions log analytics workspace as expected', () => {
    expect(construct).toHaveResourceWithProperties(LogAnalyticsWorkspace, {
      location: '${data.azurerm_resource_group.test-log-analytics-workspace-dev-lw-rg.location}',
      name: 'test-log-analytics-workspace-dev',
      resource_group_name: '${data.azurerm_resource_group.test-log-analytics-workspace-dev-lw-rg.name}',
      tags: {
        environment: 'dev',
      },
    })
  })
})
