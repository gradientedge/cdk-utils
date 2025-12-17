import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  MonitorDiagnosticSettingProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testMonitorDiagnosticSetting: MonitorDiagnosticSettingProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/monitor.json'],
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
      testMonitorDiagnosticSetting: this.node.tryGetContext('testMonitorDiagnosticSetting'),
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
    this.monitorManager.createMonitorDiagnosticSettings(
      `test-monitor-diagnostic-setting-${this.props.stage}`,
      this,
      this.props.testMonitorDiagnosticSetting
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestAzureMonitorDiagnosticSettingConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-monitor-diagnostic-setting-dev')
  })
})

describe('TestAzureMonitorDiagnosticSettingConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureMonitorDiagnosticSettingConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(Testing.toBeValidTerraform(stack)).toBeTruthy()
  })
})

describe('TestAzureMonitorDiagnosticSettingConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testMonitorDiagnosticSettingDevMonitorDiagnosticSettingFriendlyUniqueId: {
        value: 'test-monitor-diagnostic-setting-dev-ds',
      },
      testMonitorDiagnosticSettingDevMonitorDiagnosticSettingId: {
        value: '${azurerm_monitor_diagnostic_setting.test-monitor-diagnostic-setting-dev-ds.id}',
      },
      testMonitorDiagnosticSettingDevMonitorDiagnosticSettingName: {
        value: '${azurerm_monitor_diagnostic_setting.test-monitor-diagnostic-setting-dev-ds.name}',
      },
    })
  })
})

describe('TestAzureMonitorDiagnosticSettingConstruct', () => {
  test('provisions monitor diagnostic settings as expected', () => {
    expect(
      Testing.toHaveResourceWithProperties(construct, 'MonitorDiagnosticSetting', {
        enabled_log: [
          {
            category_group: 'allLogs',
          },
        ],
        metric: [
          {
            category: 'AllMetrics',
          },
        ],
        name: 'test-monitor-diagnostic-setting-dev',
        storage_account_id: 'testStorageAccountId',
        target_resource_id: 'testTargetId',
      })
    )
  })
})
