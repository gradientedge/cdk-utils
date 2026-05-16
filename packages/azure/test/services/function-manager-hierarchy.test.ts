import { WebApp } from '@pulumi/azure-native/web/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  FunctionAppProps,
  FunctionProps,
  FunctionAppFlexConsumptionProps,
} from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

const capturedResources: Record<string, pulumi.runtime.MockResourceArgs> = {}

interface TestAzureStackProps extends CommonAzureStackProps {
  testFunctionApp: FunctionAppProps
  testFunction: FunctionProps
  testFunctionAppFlexConsumption: FunctionAppFlexConsumptionProps
  logLevel?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/base.json', 'packages/azure/test/common/config/functions.json'],
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

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  functionApp: WebApp

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.functionApp = this.functionManager.createFunctionApp(
      `test-function-app-${this.props.stage}`,
      this,
      this.props.testFunctionApp
    )
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
  'project:regionContexts': JSON.stringify([
    'packages/azure/test/common/region/uksouth.json',
    'packages/azure/test/common/region/uksouth-functions.json',
  ]),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name
    capturedResources[args.name] = args
    if (args.type === 'azure-native:web:WebApp') {
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

const stack = new TestCommonStack('test-region-hierarchy-stack', testStackProps)

describe('FunctionManager - Region Context Hierarchy', () => {
  test('stage > region > base: logLevel set in all 3 layers, stage wins', () => {
    // base(base.json)='error', region(uksouth.json)='warn', stage(dev.json)='debug'
    expect(stack.props.logLevel).toEqual('debug')
  })

  test('region > base: resourcePrefix set in base and region, not in stage', () => {
    // base(base.json)='ge', region(uksouth.json)='ge-uksouth'
    expect(stack.props.resourcePrefix).toEqual('ge-uksouth')
  })

  test('base only: globalPrefix set only in base, survives through region and stage', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })

  test('region only: location and locationConfig set only in region, survive through stage', () => {
    expect(stack.props.location).toEqual('uksouth')
    expect(stack.props.locationConfig).toEqual({
      uksouth: { id: 'uksouth', name: 'UK South' },
    })
  })

  test('stage > region: subDomain set in region and stage, stage wins', () => {
    // region(uksouth.json)='uk', stage(dev.json)='dev'
    expect(stack.props.subDomain).toEqual('dev')
  })

  test('resource-level region > base: function app uses uksouth resource group from region context', async () => {
    // testFunctionApp.resourceGroupName: base(functions.json)='test-rg-dev', region(uksouth-functions.json)='test-rg-uksouth'
    await outputToPromise(
      pulumi.all([stack.construct.functionApp.name, stack.construct.functionApp.kind]).apply(([name, kind]) => {
        expect(name).toEqual('ge-uksouth-test-function-app-dev')
        expect(kind).toEqual('functionapp')
      })
    )

    const faArgs = capturedResources['test-function-app-dev-fa']
    expect(faArgs.inputs.resourceGroupName).toEqual('test-rg-uksouth')
    expect(faArgs.inputs.serverFarmId).toEqual(
      '/subscriptions/test-sub/resourceGroups/test-rg-uksouth/providers/Microsoft.Web/serverfarms/test-asp'
    )
  })
})
