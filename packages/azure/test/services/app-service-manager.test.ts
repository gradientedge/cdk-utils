import { AppServicePlan, WebApp } from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  LinuxWebAppProps,
  ServicePlanProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAppServicePlan: ServicePlanProps
  testAttribute?: string
  testLinuxWebApp: LinuxWebAppProps
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/app-service.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
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

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

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
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:web:AppServicePlan::test-app-service-plan-dev-as'
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
        stack.construct.linuxWebApp.tags,
      ])
      .apply(([id, urn, name, location, enabled, httpsOnly, tags]) => {
        expect(id).toEqual('test-linux-web-app-dev-lwa-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:web:WebApp::test-linux-web-app-dev-lwa'
        )
        expect(name).toEqual('test-linux-web-app-dev')
        expect(location).toEqual('eastus')
        expect(enabled).toEqual(true)
        expect(httpsOnly).toEqual(true)
        expect(tags?.environment).toEqual('dev')
      })
  })
})

/* --- Tests for default value fallback branches in createLinuxWebApp --- */

class TestMinimalWebAppConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  appServicePlan: AppServicePlan
  linuxWebApp: WebApp

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.appServicePlan = this.appServiceManager.createAppServicePlan(
      `test-minimal-asp-${this.props.stage}`,
      this,
      this.props.testAppServicePlan
    )

    // Create a web app with minimal props to exercise default branches
    this.linuxWebApp = this.appServiceManager.createLinuxWebApp(`test-minimal-lwa-${this.props.stage}`, this, {
      name: 'test-minimal-web-app',
      resourceGroupName: 'test-rg-dev',
      serverFarmId: '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.Web/serverfarms/test',
    } as any)
  }
}

class TestMinimalWebAppStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalWebAppConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalWebAppConstruct(props.name, this.props)
  }
}

const minimalWebAppStack = new TestMinimalWebAppStack('test-minimal-web-app-stack', testStackProps)

describe('TestAzureLinuxWebAppConstruct - Default Values', () => {
  test('linux web app uses default httpsOnly when not provided', () => {
    pulumi.all([minimalWebAppStack.construct.linuxWebApp.httpsOnly]).apply(([httpsOnly]) => {
      expect(httpsOnly).toEqual(true)
    })
  })

  test('linux web app uses default kind when not provided', () => {
    pulumi.all([minimalWebAppStack.construct.linuxWebApp.kind]).apply(([kind]) => {
      expect(kind).toEqual('app,linux')
    })
  })

  test('linux web app uses default identity when not provided', () => {
    pulumi.all([minimalWebAppStack.construct.linuxWebApp.identity]).apply(([identity]) => {
      expect(identity?.type).toEqual('SystemAssigned')
    })
  })

  test('linux web app uses default tags when not provided', () => {
    pulumi.all([minimalWebAppStack.construct.linuxWebApp.tags]).apply(([tags]) => {
      expect(tags?.environment).toEqual('dev')
    })
  })
})

/* --- Tests for resource group fallback in createLinuxWebApp --- */

describe('TestAzureLinuxWebAppConstruct - Error Handling', () => {
  test('createLinuxWebApp throws when props are undefined', () => {
    expect(() => {
      stack.construct.appServiceManager.createLinuxWebApp('test-lwa-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-lwa-err')
  })

  test('createLinuxWebApp throws when resourceGroupName is missing', () => {
    expect(() => {
      class NoRgWebAppConstruct extends CommonAzureConstruct {
        constructor(name: string, props: any) {
          super(name, props)
          this.appServiceManager.createLinuxWebApp('test-no-rg-lwa', this, {
            name: 'test-no-rg-web-app',
            serverFarmId: '/some/id',
          } as any)
        }
      }
      class NoRgWebAppStack extends CommonAzureStack {
        constructor(name: string, props: any) {
          super(name, { ...testStackProps, resourceGroupName: undefined })
          new NoRgWebAppConstruct(props.name, this.props)
        }
      }
      new NoRgWebAppStack('test-no-rg-lwa-stack', testStackProps)
    }).toThrow('Resource group name undefined for test-no-rg-lwa')
  })
})
