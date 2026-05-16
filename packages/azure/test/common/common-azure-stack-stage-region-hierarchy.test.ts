import * as pulumi from '@pulumi/pulumi'
import { AzureLocation, CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps } from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  logLevel?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  features: {},
  name: 'test-azure-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'tst',
  stageContextPath: 'packages/azure/test/common/env',
}

class TestAzureStack extends CommonAzureStack {
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
  'project:stage': 'tst',
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:location': 'uksouth',
  'project:extraContexts': JSON.stringify(baseContexts),
  'project:regionContextPath': 'packages/azure/test/common/region',
  'project:stageRegionContextPath': 'packages/azure/test/common/env-region',
})

const stack = new TestAzureStack('test-stack-stage-region', {
  ...testStackProps,
  extraContexts: baseContexts,
})

describe('CommonAzureStack - Stage-Region Context Hierarchy', () => {
  test('stage-region > stage > region > base: logLevel set in all layers, stage-region wins', () => {
    // base(base.json)='error', region(uksouth.json)='warn', stage(tst.json)='debug', stage-region(tst.uksouth.json)='trace'
    expect(stack.props.logLevel).toEqual('trace')
  })

  test('stage-region > region: resourcePrefix overridden by stage-region', () => {
    // base(base.json)='ge', region(uksouth.json)='ge-uksouth', stage-region(tst.uksouth.json)='ge-dev-uksouth'
    expect(stack.props.resourcePrefix).toEqual('ge-dev-uksouth')
  })

  test('base only: globalPrefix set only in base, survives through all layers', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })

  test('region only: locationConfig set only in region, survives through stage and stage-region', () => {
    expect(stack.props.location).toEqual(AzureLocation.UKSouth)
    expect(stack.props.locationConfig).toEqual({
      uksouth: { id: 'uksouth', name: 'UK South' },
    })
  })

  test('stage > region but stage-region does not set subDomain: stage value survives', () => {
    // region(uksouth.json)='uk', stage(tst.json)='tst', stage-region does not set subDomain → stage wins
    expect(stack.props.subDomain).toEqual('tst')
  })
})

describe('CommonAzureStack - Stage-Region Context - Graceful Handling', () => {
  test('missing stage-region file is silently skipped', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': 'prd',
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:location': 'uksouth',
      'project:extraContexts': JSON.stringify(baseContexts),
      'project:regionContextPath': 'packages/azure/test/common/region',
      'project:stageRegionContextPath': 'packages/azure/test/common/env-region',
    })

    // no prd.uksouth.json exists → stage-region layer skipped, no prd.json → stage layer skipped
    const prdStack = new TestAzureStack('test-stack-no-stage-region', {
      ...testStackProps,
      extraContexts: baseContexts,
      stage: 'prd',
    })
    // region value survives
    expect(prdStack.props.resourcePrefix).toEqual('ge-uksouth')
    expect(prdStack.props.location).toEqual(AzureLocation.UKSouth)
  })
})
