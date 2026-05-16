import { ResourceGroup } from '@pulumi/azure-native/resources/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  AzureLocation,
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  ResourceGroupProps,
} from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testResourceGroup: ResourceGroupProps
  logLevel?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/base.json',
    'packages/azure/test/common/config/resource-group.json',
  ],
  features: {},
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
  resourceGroup: ResourceGroup

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.resourceGroup = this.resourceGroupManager.createResourceGroup(
      `test-resource-group-${this.props.stage}`,
      this,
      this.props.testResourceGroup
    )
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
  'project:regionContexts': JSON.stringify([
    'packages/azure/test/common/region/uksouth.json',
    'packages/azure/test/common/region/uksouth-resource-group.json',
  ]),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name
    if (args.type === 'azure-native:resources:ResourceGroup') {
      name = args.inputs.resourceGroupName
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

describe('ResourceGroup - Region Context Hierarchy', () => {
  test('stage > region > base: logLevel set in all 3 layers, stage wins', () => {
    // base(base.json)='error', region(uksouth.json)='warn', stage(dev.json)='debug'
    expect(stack.props.logLevel).toEqual('debug')
  })

  test('region > base: resourcePrefix set in base and region, not in stage', () => {
    // base(base.json)='ge', region(uksouth.json)='ge-uksouth'
    expect(stack.props.resourcePrefix).toEqual('ge-uksouth')
  })

  test('base only: globalPrefix set only in base, survives through region and stage', () => {
    // base(base.json)='gradientedge', region/stage not set
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

  test('resource-level region > base: resource group uses uksouth location from region context', async () => {
    // testResourceGroup.location: base(resource-group.json)='eastus', region(uksouth-resource-group.json)='uksouth'
    await outputToPromise(
      pulumi
        .all([
          stack.construct.resourceGroup.id,
          stack.construct.resourceGroup.name,
          stack.construct.resourceGroup.location,
          stack.construct.resourceGroup.tags,
        ])
        .apply(([id, name, location, tags]) => {
          expect(id).toEqual('test-resource-group-dev-rg-id')
          expect(name).toEqual('ge-uksouth-test-resource-group-dev')
          expect(location).toEqual('uksouth')
          expect(tags?.environment).toEqual('dev')
        })
    )
  })
})
