import { Resource } from '@pulumi/azure-native/resources/index.js'
import { WebApp, WebAppFunction } from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  FunctionAppFlexConsumptionProps,
  FunctionAppProps,
  FunctionProps,
} from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

const capturedResources: Record<string, pulumi.runtime.MockResourceArgs> = {}

interface TestAzureStackProps extends CommonAzureStackProps {
  testFunctionApp: FunctionAppProps
  testFunction: FunctionProps
  testFunctionAppFlexConsumption: FunctionAppFlexConsumptionProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/functions.json'],
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
    return { ...baseProps, testFunctionApp: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  functionApp: WebApp
  function: WebAppFunction
  functionAppFlexConsumption: WebApp

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.functionApp = this.functionManager.createFunctionApp(
      `test-function-app-${this.props.stage}`,
      this,
      this.props.testFunctionApp
    )
    this.function = this.functionManager.createFunction(
      `test-function-${this.props.stage}`,
      this,
      this.props.testFunction
    )
    this.functionAppFlexConsumption = this.functionManager.createFunctionAppFlexConsumption(
      `test-function-app-flex-consumption-${this.props.stage}`,
      this,
      this.props.testFunctionAppFlexConsumption
    )
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

    capturedResources[args.name] = args

    // Return different names based on resource type
    if (args.type === 'azure-native:web:WebApp') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:web:WebAppFunction') {
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

describe('TestAzureFunctionConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-function-app-dev')
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.functionApp).toBeDefined()
    expect(stack.construct.function).toBeDefined()
    expect(stack.construct.functionAppFlexConsumption).toBeDefined()
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('provisions function app as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.functionApp.id,
          stack.construct.functionApp.urn,
          stack.construct.functionApp.name,
          stack.construct.functionApp.location,
          stack.construct.functionApp.kind,
        ])
        .apply(([id, urn, name, location, kind]) => {
          expect(id).toEqual('test-function-app-dev-fa-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:web:WebApp::test-function-app-dev-fa'
          )
          expect(name).toEqual('test-function-app-dev')
          expect(location).toEqual('eastus')
          expect(kind).toEqual('functionapp')
        })
    )
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('provisions function as expected', async () => {
    await outputToPromise(
      pulumi
        .all([stack.construct.function.id, stack.construct.function.urn, stack.construct.function.name])
        .apply(([id, urn, name]) => {
          expect(id).toEqual('test-function-dev-fc-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:web:WebAppFunction::test-function-dev-fc'
          )
          expect(name).toEqual('test-function-dev')
        })
    )
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('provisions flex consumption function app as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.functionAppFlexConsumption.id,
          stack.construct.functionAppFlexConsumption.urn,
          stack.construct.functionAppFlexConsumption.name,
          stack.construct.functionAppFlexConsumption.location,
          stack.construct.functionAppFlexConsumption.kind,
          stack.construct.functionAppFlexConsumption.functionAppConfig,
        ])
        .apply(([id, urn, name, location, kind, functionAppConfig]) => {
          expect(id).toEqual('test-function-app-flex-consumption-dev-fc-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:web:WebApp::test-function-app-flex-consumption-dev-fc'
          )
          expect(name).toEqual('test-function-app-flex-consumption-dev')
          expect(location).toEqual('eastus')
          expect(kind).toEqual('functionapp')
        })
    )
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('flex consumption function app has correct functionAppConfig', async () => {
    await outputToPromise(
      pulumi.all([stack.construct.functionAppFlexConsumption.functionAppConfig]).apply(([functionAppConfig]) => {
        expect(functionAppConfig).toBeDefined()
        expect(functionAppConfig?.runtime?.name).toEqual('node')
        expect(functionAppConfig?.runtime?.version).toEqual('22')
        expect(functionAppConfig?.scaleAndConcurrency?.instanceMemoryMB).toEqual(2048)
        expect(functionAppConfig?.scaleAndConcurrency?.maximumInstanceCount).toEqual(100)
      })
    )
  })

  test('flex consumption deployment has correct settings', () => {
    const deploymentArgs = capturedResources['test-function-app-flex-consumption-dev-deployment']
    expect(deploymentArgs).toBeDefined()
    expect(deploymentArgs.type).toEqual('azure-native:resources:Deployment')

    const template = deploymentArgs.inputs.properties.template
    expect(template.$schema).toEqual('https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#')
    expect(template.contentVersion).toEqual('1.0.0.0')

    const resource = template.resources[0]
    expect(resource.type).toEqual('Microsoft.Web/sites')
    expect(resource.apiVersion).toEqual('2024-04-01')
    expect(resource.location).toEqual('eastus')

    const config = resource.properties.functionAppConfig
    expect(config.runtime.name).toEqual('node')
    expect(config.runtime.version).toEqual('22')
    expect(config.scaleAndConcurrency.instanceMemoryMB).toEqual(2048)
    expect(config.scaleAndConcurrency.maximumInstanceCount).toEqual(100)
    expect(config.siteUpdateStrategy.type).toEqual('RollingUpdate')
  })
})

/* --- Tests for default value fallback branches --- */

interface TestMinimalAzureStackProps extends CommonAzureStackProps {
  testFunctionAppMinimal: FunctionAppProps
  testFunctionMinimal: FunctionProps
  testFunctionAppFlexConsumptionMinimal: FunctionAppFlexConsumptionProps
  testFunctionAppFlexConsumptionResource: FunctionAppFlexConsumptionProps
  testAttribute?: string
}

class TestMinimalConstruct extends CommonAzureConstruct {
  declare props: TestMinimalAzureStackProps
  functionApp: WebApp
  functionWithEnabled: WebAppFunction
  functionAppFlexConsumption: WebApp
  functionAppFlexConsumptionResource: Resource

  constructor(name: string, props: TestMinimalAzureStackProps) {
    super(name, props)

    // FunctionApp with minimal props - exercises location/kind/identity/tags defaults
    this.functionApp = this.functionManager.createFunctionApp(`test-minimal-fa-${this.props.stage}`, this, {
      name: 'test-minimal-function-app',
      resourceGroupName: 'test-rg-dev',
      serverFarmId: '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.Web/serverfarms/test-asp',
    } as any)

    // Function with enabled=true to exercise the `enabled !== undefined` branch
    this.functionWithEnabled = this.functionManager.createFunction(`test-enabled-fn-${this.props.stage}`, this, {
      name: 'test-enabled-function',
      functionAppId: '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.Web/sites/test-fa',
      resourceGroupName: 'test-rg-dev',
      enabled: true,
    })

    // FlexConsumption with minimal props - no runtime, no scaleAndConcurrency, no functionAppConfig, no siteConfig
    this.functionAppFlexConsumption = this.functionManager.createFunctionAppFlexConsumption(
      `test-minimal-flex-${this.props.stage}`,
      this,
      {
        name: 'test-minimal-flex-consumption',
        resourceGroupName: 'test-rg-dev',
        serverFarmId: '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.Web/serverfarms/test-asp',
      } as any
    )

    // FlexConsumptionResource with minimal props
    this.functionAppFlexConsumptionResource = this.functionManager.createFunctionAppFlexConsumptionResource(
      `test-minimal-flex-resource-${this.props.stage}`,
      this,
      {
        name: 'test-minimal-flex-resource',
        resourceGroupName: 'test-rg-dev',
        serverFarmId: '/subscriptions/test-sub/resourceGroups/test-rg-dev/providers/Microsoft.Web/serverfarms/test-asp',
      } as any
    )
  }
}

class TestMinimalCommonStack extends CommonAzureStack {
  declare props: TestMinimalAzureStackProps
  declare construct: TestMinimalConstruct

  constructor(name: string, props: TestMinimalAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalConstruct(props.name, this.props as any)
  }
}

const minimalStack = new TestMinimalCommonStack('test-minimal-stack', testStackProps)

describe('TestAzureFunctionConstruct - Default Value Branches', () => {
  test('function app uses default location from scope when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalStack.construct.functionApp.location]).apply(([location]) => {
        expect(location).toEqual('eastus')
      })
    )
  })

  test('function app uses default kind when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalStack.construct.functionApp.kind]).apply(([kind]) => {
        expect(kind).toEqual('functionapp,linux')
      })
    )
  })

  test('function app uses default tags when not provided', async () => {
    await outputToPromise(
      pulumi.all([minimalStack.construct.functionApp.tags]).apply(([tags]) => {
        expect(tags?.environment).toEqual('dev')
      })
    )
  })

  test('function with enabled=true sets isDisabled to false', () => {
    const fnArgs = capturedResources['test-enabled-fn-dev-fc']
    expect(fnArgs).toBeDefined()
    expect(fnArgs.inputs.isDisabled).toEqual(false)
  })

  test('flex consumption app uses default runtime, scaleAndConcurrency, and siteConfig', () => {
    const flexArgs = capturedResources['test-minimal-flex-dev-fc']
    expect(flexArgs).toBeDefined()
    expect(flexArgs.inputs.kind).toEqual('functionapp,linux')
    expect(flexArgs.inputs.httpsOnly).toEqual(true)
    expect(flexArgs.inputs.functionAppConfig.runtime.name).toEqual('node')
    expect(flexArgs.inputs.functionAppConfig.runtime.version).toEqual('22')
    expect(flexArgs.inputs.functionAppConfig.scaleAndConcurrency.instanceMemoryMB).toEqual(4096)
    expect(flexArgs.inputs.functionAppConfig.scaleAndConcurrency.maximumInstanceCount).toEqual(40)
    expect(flexArgs.inputs.siteConfig.http20Enabled).toEqual(true)
    expect(flexArgs.inputs.siteConfig.linuxFxVersion).toEqual('node|22')
  })

  test('flex consumption deployment uses default values', () => {
    const deploymentArgs = capturedResources['test-minimal-flex-dev-deployment']
    expect(deploymentArgs).toBeDefined()
    const config = deploymentArgs.inputs.properties.template.resources[0].properties.functionAppConfig
    expect(config.runtime.name).toEqual('node')
    expect(config.runtime.version).toEqual('22')
    expect(config.scaleAndConcurrency.instanceMemoryMB).toEqual(4096)
    expect(config.scaleAndConcurrency.maximumInstanceCount).toEqual(40)
  })

  test('flex consumption resource uses default values', () => {
    const resourceArgs = capturedResources['test-minimal-flex-resource-dev-fc']
    expect(resourceArgs).toBeDefined()
    expect(resourceArgs.inputs.kind).toEqual('functionapp,linux')
    expect(resourceArgs.inputs.properties.httpsOnly).toEqual(true)
    expect(resourceArgs.inputs.properties.functionAppConfig.runtime.name).toEqual('node')
    expect(resourceArgs.inputs.properties.functionAppConfig.runtime.version).toEqual('22')
    expect(resourceArgs.inputs.properties.functionAppConfig.scaleAndConcurrency.instanceMemoryMB).toEqual(4096)
    expect(resourceArgs.inputs.properties.functionAppConfig.scaleAndConcurrency.maximumInstanceCount).toEqual(40)
    expect(resourceArgs.inputs.properties.functionAppConfig.siteUpdateStrategy.type).toEqual('RollingUpdate')
  })
})

describe('TestAzureFunctionConstruct - Props Undefined', () => {
  test('createFunction throws when props are undefined', () => {
    expect(() => {
      stack.construct.functionManager.createFunction('test-fn-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-fn-err')
  })

  test('createFunctionAppFlexConsumption throws when props are undefined', () => {
    expect(() => {
      stack.construct.functionManager.createFunctionAppFlexConsumption(
        'test-flex-err',
        stack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-flex-err')
  })

  test('createFunctionAppFlexConsumptionResource throws when props are undefined', () => {
    expect(() => {
      stack.construct.functionManager.createFunctionAppFlexConsumptionResource(
        'test-flex-res-err',
        stack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-flex-res-err')
  })
})
