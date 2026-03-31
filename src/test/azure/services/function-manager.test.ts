import { WebApp, WebAppFunction } from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  FunctionAppFlexConsumptionProps,
  FunctionAppProps,
  FunctionProps,
} from '../../../lib/azure/index.js'

const capturedResources: Record<string, pulumi.runtime.MockResourceArgs> = {}

interface TestAzureStackProps extends CommonAzureStackProps {
  testFunctionApp: FunctionAppProps
  testFunction: FunctionProps
  testFunctionAppFlexConsumption: FunctionAppFlexConsumptionProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/functions.json'],
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
  test('provisions function app as expected', () => {
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:web:WebApp::test-function-app-dev-fa'
        )
        expect(name).toEqual('test-function-app-dev')
        expect(location).toEqual('eastus')
        expect(kind).toEqual('functionapp')
      })
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('provisions function as expected', () => {
    pulumi
      .all([stack.construct.function.id, stack.construct.function.urn, stack.construct.function.name])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-function-dev-fc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:web:WebAppFunction::test-function-dev-fc'
        )
        expect(name).toEqual('test-function-dev')
      })
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('provisions flex consumption function app as expected', () => {
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
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:web:WebApp::test-function-app-flex-consumption-dev-fc'
        )
        expect(name).toEqual('test-function-app-flex-consumption-dev')
        expect(location).toEqual('eastus')
        expect(kind).toEqual('functionapp')
      })
  })
})

describe('TestAzureFunctionConstruct', () => {
  test('flex consumption function app has correct functionAppConfig', () => {
    pulumi.all([stack.construct.functionAppFlexConsumption.functionAppConfig]).apply(([functionAppConfig]) => {
      expect(functionAppConfig).toBeDefined()
      expect(functionAppConfig?.runtime?.name).toEqual('node')
      expect(functionAppConfig?.runtime?.version).toEqual('22')
      expect(functionAppConfig?.scaleAndConcurrency?.instanceMemoryMB).toEqual(2048)
      expect(functionAppConfig?.scaleAndConcurrency?.maximumInstanceCount).toEqual(100)
    })
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
    expect(config.scaleAndConcurrency.instanceMemoryMB).toEqual(4096)
    expect(config.scaleAndConcurrency.maximumInstanceCount).toEqual(40)
    expect(config.siteUpdateStrategy.type).toEqual('RollingUpdate')
  })
})
