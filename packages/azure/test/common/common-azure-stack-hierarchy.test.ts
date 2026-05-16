import * as pulumi from '@pulumi/pulumi'
import { AzureLocation, CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps } from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
  logLevel?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  features: {},
  name: 'test-azure-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
}

class TestAzureStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestAzureConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestAzureConstruct(props.name, this.props)
  }
}

class TestAzureConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: { ...args.inputs },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const baseContexts = ['packages/azure/test/common/config/base.json']

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:location': 'uksouth',
  'project:extraContexts': JSON.stringify(baseContexts),
  'project:regionContextPath': 'packages/azure/test/common/region',
})

const stackUkSouth = new TestAzureStack('test-stack-region-uksouth', {
  ...testStackProps,
  extraContexts: baseContexts,
})

describe('CommonAzureStack - Region Context Hierarchy - UKSouth', () => {
  const stack = stackUkSouth

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
    expect(stack.props.location).toEqual(AzureLocation.UKSouth)
    expect(stack.props.locationConfig).toEqual({
      uksouth: { id: 'uksouth', name: 'UK South' },
    })
  })

  test('stage > region: subDomain set in region and stage, stage wins', () => {
    // region(uksouth.json)='uk', stage(dev.json)='dev'
    expect(stack.props.subDomain).toEqual('dev')
  })
})

describe('CommonAzureStack - Region Context Hierarchy - WestEurope', () => {
  const baseContexts = ['packages/azure/test/common/config/base.json']

  pulumi.runtime.setAllConfig({
    'project:stage': testStackProps.stage,
    'project:stageContextPath': testStackProps.stageContextPath,
    'project:location': 'westeurope',
    'project:extraContexts': JSON.stringify(baseContexts),
    'project:regionContextPath': 'packages/azure/test/common/region',
  })

  const stack = new TestAzureStack('test-stack-region-westeurope', {
    ...testStackProps,
    extraContexts: baseContexts,
  })

  test('stage > region > base: logLevel set in all 3 layers, stage wins', () => {
    expect(stack.props.logLevel).toEqual('debug')
  })

  test('region > base: resourcePrefix set in base and region, not in stage', () => {
    expect(stack.props.resourcePrefix).toEqual('ge-westeurope')
  })

  test('region only: location and locationConfig from westeurope region', () => {
    expect(stack.props.location).toEqual(AzureLocation.WestEurope)
    expect(stack.props.locationConfig).toEqual({
      westeurope: { id: 'westeurope', name: 'West Europe' },
    })
  })

  test('stage > region: subDomain set in region and stage, stage wins', () => {
    expect(stack.props.subDomain).toEqual('dev')
  })
})

describe('CommonAzureStack - Region Context Hierarchy - Auto-Select from Multiple Regions', () => {
  const baseContexts = ['packages/azure/test/common/config/base.json']

  pulumi.runtime.setAllConfig({
    'project:stage': testStackProps.stage,
    'project:stageContextPath': testStackProps.stageContextPath,
    'project:location': 'westeurope',
    'project:extraContexts': JSON.stringify(baseContexts),
    'project:regionContextPath': 'packages/azure/test/common/region',
  })

  const stack = new TestAzureStack('test-stack-region-multi', {
    ...testStackProps,
    extraContexts: baseContexts,
  })

  test('only the matching region file is applied when multiple are configured', () => {
    // location is 'westeurope', so uksouth.json is skipped and westeurope.json is applied
    expect(stack.props.location).toEqual(AzureLocation.WestEurope)
    expect(stack.props.resourcePrefix).toEqual('ge-westeurope')
    expect(stack.props.locationConfig).toEqual({
      westeurope: { id: 'westeurope', name: 'West Europe' },
    })
  })
})

describe('CommonAzureStack - Region Context Hierarchy - Graceful Handling', () => {
  test('handles missing region context file gracefully', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:location': 'nonexistent',
      'project:regionContextPath': 'packages/azure/test/common/region',
      'project:extraContexts': JSON.stringify(['packages/azure/test/common/config/dummy.json']),
    })

    const stack = new TestAzureStack('test-stack-missing-region', testStackProps)
    expect(stack.props.testAttribute).toEqual('success')
    expect(stack.props.stage).toEqual('dev')
    expect(stack.props.locationConfig).toBeUndefined()
  })

  test('no regionContextPath leaves props unaffected by region layer', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(['packages/azure/test/common/config/dummy.json']),
    })

    const stack = new TestAzureStack('test-stack-no-region', testStackProps)
    expect(stack.props.testAttribute).toEqual('success')
    expect(stack.props.stage).toEqual('dev')
    expect(stack.props.domainName).toEqual('gradientedge.io')
    expect(stack.props.locationConfig).toBeUndefined()
  })

  test('no location set skips region context even when regionContextPath is configured', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:regionContextPath': 'packages/azure/test/common/region',
      'project:extraContexts': JSON.stringify(['packages/azure/test/common/config/dummy.json']),
    })

    const stack = new TestAzureStack('test-stack-no-location', testStackProps)
    expect(stack.props.locationConfig).toBeUndefined()
    expect(stack.props.testAttribute).toEqual('success')
  })
})
