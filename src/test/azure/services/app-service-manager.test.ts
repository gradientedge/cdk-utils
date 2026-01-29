import { AppServicePlan, WebApp } from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  LinuxWebAppProps,
  ServicePlanProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAppServicePlan: ServicePlanProps
  testAttribute?: string
  testLinuxWebApp: LinuxWebAppProps
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/app-service.json'],
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
    return { ...baseProps, testAppServicePlan: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  appServicePlan: AppServicePlan
  linuxWebApp: WebApp

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.appServicePlan = this.appServiceManager.createAppServicePlan(
      `test-app-service-plan-${this.props.stage}`,
      this,
      this.props.testAppServicePlan
    )

    this.linuxWebApp = this.appServiceManager.createLinuxWebApp(`test-linux-web-app-${this.props.stage}`, this, {
      ...this.props.testLinuxWebApp,
    })
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:web:AppServicePlan') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:web:WebApp') {
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

describe('TestAzureAppServiceConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-app-service-plan-dev')
  })
})

describe('TestAzureAppServiceConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureAppServiceConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.appServicePlan).toBeDefined()
    expect(stack.construct.linuxWebApp).toBeDefined()
  })
})

describe('TestAzureAppServiceConstruct', () => {
  test('provisions app service plan as expected', () => {
    pulumi
      .all([
        stack.construct.appServicePlan.id,
        stack.construct.appServicePlan.urn,
        stack.construct.appServicePlan.name,
        stack.construct.appServicePlan.location,
        stack.construct.appServicePlan.sku,
        stack.construct.appServicePlan.tags,
      ])
      .apply(([id, urn, name, location, sku, tags]) => {
        expect(id).toEqual('test-app-service-plan-dev-as-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:web:AppServicePlan::test-app-service-plan-dev-as'
        )
        expect(name).toEqual('test-app-service-plan-dev')
        expect(location).toEqual('eastus')
        expect(sku).toEqual({ name: 'B1', tier: 'Basic' })
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureLinuxWebAppConstruct', () => {
  test('provisions linux web app as expected', () => {
    pulumi
      .all([
        stack.construct.linuxWebApp.id,
        stack.construct.linuxWebApp.urn,
        stack.construct.linuxWebApp.name,
        stack.construct.linuxWebApp.location,
        stack.construct.linuxWebApp.enabled,
        stack.construct.linuxWebApp.httpsOnly,
        stack.construct.linuxWebApp.siteConfig,
        stack.construct.linuxWebApp.tags,
      ])
      .apply(([id, urn, name, location, enabled, httpsOnly, siteConfig, tags]) => {
        expect(id).toEqual('test-linux-web-app-dev-lwa-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:web:WebApp::test-linux-web-app-dev-lwa'
        )
        expect(name).toEqual('test-linux-web-app-dev')
        expect(location).toEqual('eastus')
        expect(enabled).toEqual(true)
        expect(httpsOnly).toEqual(true)
        expect(siteConfig).toEqual({
          alwaysOn: true,
          http20Enabled: true,
          localMySqlEnabled: false,
          netFrameworkVersion: 'v4.6',
        })
        expect(tags?.environment).toEqual('dev')
      })
  })
})
