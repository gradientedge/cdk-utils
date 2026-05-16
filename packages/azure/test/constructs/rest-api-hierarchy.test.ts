import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import {
  AzureApi,
  AzureLocation,
  AzureRestApi,
  AzureRestApiProps,
  CommonAzureStack,
  CommonAzureStackProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  logLevel?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/base.json', 'packages/azure/test/common/config/rest-api.json'],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
  subscriptionId: 'test-subscription-id',
} as TestAzureStackProps

class TestRestApiConstruct extends AzureRestApi {
  declare props: AzureRestApiProps & TestAzureStackProps

  constructor(name: string, props: AzureRestApiProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.api = {} as AzureApi
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveApiKeyVault()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createApiManagement()
  }
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestRestApiConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestRestApiConstruct(props.name, this.props as AzureRestApiProps & TestAzureStackProps)
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath ?? '',
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
  'project:regionContexts': JSON.stringify([
    'packages/azure/test/common/region/uksouth.json',
    'packages/azure/test/common/region/uksouth-rest-api.json',
  ]),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name
    if (args.type === 'azure-native:resources:ResourceGroup') {
      name = args.inputs.resourceGroupName
    } else if (args.type === 'azure-native:apimanagement:ApiManagementService') {
      name = args.inputs.serviceName
    } else if (args.type === 'pulumi:pulumi:StackReference') {
      return {
        id: `${args.name}-id`,
        state: {
          ...args.inputs,
          outputs: {
            apiManagementId: 'mock-apim-id',
            apiManagementName: 'mock-apim-name',
            resourceGroupName: 'mock-rg-name',
          },
        },
      }
    }
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        name,
        identity: { principalId: 'mock-principal-id' },
        primaryKey: 'mock-primary-key',
      },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-region-api-stack', testStackProps)

describe('RestApi - Region Context Hierarchy', () => {
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

  test('resource-level region > base: api management uses uksouth config from region context', async () => {
    // apiManagement.serviceName: base(rest-api.json)='test-api-management', region(uksouth-rest-api.json)='test-api-management-uksouth'
    expect(stack.construct.api).toBeDefined()
    expect(stack.construct.api.authKeyVault).toBeDefined()

    await outputToPromise(
      pulumi.all([stack.construct.resourceGroup.id, stack.construct.resourceGroup.tags]).apply(([id, tags]) => {
        expect(id).toEqual('test-common-stack-rg-id')
        expect(tags?.environment).toEqual('dev')
      })
    )
  })
})
