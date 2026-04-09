import * as pulumi from '@pulumi/pulumi'
import { DefenderForStorage } from '@pulumi/azure-native/security/index.js'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  DefenderForStorageProps,
} from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  defenderForStorage: DefenderForStorage

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.defenderForStorage = this.securityCentermanager.createDefenderForStorage(
      `test-defender-${this.props.stage}`,
      this,
      {
        resourceId: '/subscriptions/test-sub/resourceGroups/test-rg/providers/Microsoft.Storage/storageAccounts/testsa',
      } as DefenderForStorageProps
    )
  }
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name: args.name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureSecurityCenterManager', () => {
  test('provisions defender for storage as expected', async () => {
    expect(stack.construct.defenderForStorage).toBeDefined()
    await outputToPromise(
      pulumi.all([stack.construct.defenderForStorage.id]).apply(([id]) => {
        expect(id).toBeDefined()
      })
    )
  })

  test('throws when props are undefined', () => {
    expect(() => {
      stack.construct.securityCentermanager.createDefenderForStorage(
        'test-defender-err',
        stack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-defender-err')
  })
})
