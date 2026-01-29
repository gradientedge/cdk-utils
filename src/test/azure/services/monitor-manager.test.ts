import { DiagnosticSetting } from '@pulumi/azure-native/monitor/index.js'
import * as pulumi from '@pulumi/pulumi'
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
    return { ...baseProps, testMonitorDiagnosticSetting: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  monitorDiagnosticSetting: DiagnosticSetting

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.monitorDiagnosticSetting = this.monitorManager.createMonitorDiagnosticSettings(
      `test-monitor-diagnostic-setting-${this.props.stage}`,
      this,
      this.props.testMonitorDiagnosticSetting
    )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    if (args.type === 'azure-native:monitor:DiagnosticSetting') {
      name = args.inputs.name
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

describe('TestAzureMonitorConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-monitor-diagnostic-setting-dev')
  })
})

describe('TestAzureMonitorConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureMonitorConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.monitorDiagnosticSetting).toBeDefined()
  })
})

describe('TestAzureMonitorConstruct', () => {
  test('provisions monitor diagnostic settings as expected', () => {
    pulumi
      .all([
        stack.construct.monitorDiagnosticSetting.id,
        stack.construct.monitorDiagnosticSetting.urn,
        stack.construct.monitorDiagnosticSetting.name,
        stack.construct.monitorDiagnosticSetting.logs,
        stack.construct.monitorDiagnosticSetting.metrics,
        stack.construct.monitorDiagnosticSetting.storageAccountId,
      ])
      .apply(([id, urn, name, logs, metrics, storageAccountId]) => {
        expect(id).toEqual('test-monitor-diagnostic-setting-dev-ds-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:monitor:DiagnosticSetting::test-monitor-diagnostic-setting-dev-ds'
        )
        expect(name).toEqual('test-monitor-diagnostic-setting-dev')
        expect(logs).toEqual([{ categoryGroup: 'allLogs', enabled: true }])
        expect(metrics).toEqual([{ category: 'AllMetrics', enabled: true }])
        expect(storageAccountId).toEqual(
          '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.Storage/storageAccounts/testsa'
        )
      })
  })
})
