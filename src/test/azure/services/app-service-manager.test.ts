import { ServicePlan } from '@cdktf/provider-azurerm/lib/service-plan'
import { LinuxWebApp } from '@cdktf/provider-azurerm/lib/linux-web-app'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ServicePlanProps,
  LinuxWebAppProps,
} from '../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAppServicePlan: ServicePlanProps
  testAttribute?: string
  testLinuxWebApp: LinuxWebAppProps
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/app-service.json'],
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
      testAppServicePlan: this.node.tryGetContext('testAppServicePlan'),
      testLinuxWebApp: this.node.tryGetContext('testLinuxWebApp'),
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
    const appServicePlan = this.appServiceManager.createAppServicePlan(
      `test-app-service-plan-${this.props.stage}`,
      this,
      this.props.testAppServicePlan
    )

    this.appServiceManager.createLinuxWebApp(`test-linux-web-app-${this.props.stage}`, this, {
      ...this.props.testLinuxWebApp,
      servicePlanId: appServicePlan.id,
    })
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(ServicePlan, {}))

describe('TestAzureAppServicePlanConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-app-service-plan-dev')
  })
})

describe('TestAzureAppServicePlanConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureAppServicePlanConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureAppServicePlanConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testAppServicePlanDevAppServicePlanFriendlyUniqueId: {
        value: 'test-app-service-plan-dev-as',
      },
      testAppServicePlanDevAppServicePlanId: {
        value: '${azurerm_service_plan.test-app-service-plan-dev-as.id}',
      },
      testAppServicePlanDevAppServicePlanName: {
        value: '${azurerm_service_plan.test-app-service-plan-dev-as.name}',
      },
      testLinuxWebAppDevLinuxWebAppFriendlyUniqueId: {
        value: 'test-linux-web-app-dev-lwa',
      },
      testLinuxWebAppDevLinuxWebAppId: {
        value: '${azurerm_linux_web_app.test-linux-web-app-dev-lwa.id}',
      },
      testLinuxWebAppDevLinuxWebAppName: {
        value: '${azurerm_linux_web_app.test-linux-web-app-dev-lwa.name}',
      },
    })
  })
})

describe('TestAzureAppServicePlanConstruct', () => {
  test('provisions app service plan as expected', () => {
    expect(construct).toHaveResourceWithProperties(ServicePlan, {
      name: 'test-app-service-plan-dev',
      resource_group_name: '${data.azurerm_resource_group.test-app-service-plan-dev-as-rg.name}',
      tags: {
        environment: 'dev',
      },
    })
  })
})

describe('TestAzureLinuxWebAppConstruct', () => {
  test('provisions linux web app as expected', () => {
    expect(construct).toHaveResourceWithProperties(LinuxWebApp, {
      enabled: true,
      https_only: true,
      name: 'test-linux-web-app-dev',
      resource_group_name: '${data.azurerm_resource_group.test-linux-web-app-dev-as-rg.name}',
      service_plan_id: '${azurerm_service_plan.test-app-service-plan-dev-as.id}',
      site_config: {
        always_on: true,
        application_stack: {
          node_version: '22-lts',
        },
        minimum_tls_version: '1.3',
      },
      tags: {
        environment: 'dev',
      },
    })
  })
})
