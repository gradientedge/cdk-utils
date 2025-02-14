import { ApplicationInsights } from '@cdktf/provider-azurerm/lib/application-insights'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ApplicationInsightsProps,
} from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testApplicationInsights: ApplicationInsightsProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/azure/common/cdkConfig/dummy.json',
    'src/test/azure/common/cdkConfig/application-insights.json',
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
      testApplicationInsights: this.node.tryGetContext('testApplicationInsights'),
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
    this.applicationInsightsManager.createApplicationInsights(
      `test-application-insights-${this.props.stage}`,
      this,
      this.props.testApplicationInsights
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(ApplicationInsights, {}))

describe('TestAzureApplicationInsightsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-application-insights-dev')
  })
})

describe('TestAzureApplicationInsightsConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureApplicationInsightsConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureApplicationInsightsConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testApplicationInsightsDevApplicationInsightsFriendlyUniqueId: {
        value: 'test-application-insights-dev-am',
      },
      testApplicationInsightsDevApplicationInsightsId: {
        value: '${azurerm_application_insights.test-application-insights-dev-am.id}',
      },
      testApplicationInsightsDevApplicationInsightsName: {
        value: '${azurerm_application_insights.test-application-insights-dev-am.name}',
      },
    })
  })
})

describe('TestAzureApplicationInsightsConstruct', () => {
  test('provisions application insights as expected', () => {
    expect(construct).toHaveResourceWithProperties(ApplicationInsights, {
      name: 'test-application-insights-dev',
      resource_group_name: '${data.azurerm_resource_group.test-application-insights-dev-am-rg.name}',
    })
  })
})
