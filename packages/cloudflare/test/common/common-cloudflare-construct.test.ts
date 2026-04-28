import { Zone, ZoneCacheReserve } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneProps,
} from '../../src/index.js'
import { outputToPromise } from '../helpers.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/cloudflare/test/common/config/dummy.json',
    'packages/cloudflare/test/common/config/zone.json',
  ],
  features: {},
  name: 'test-common-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/cloudflare/test/common/env',
}

class TestCommonCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  zoneCacheReserve: ZoneCacheReserve

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneCacheReserve = this.zoneManager.createZoneCacheReserve(
      `test-zone-cache-reserve-${this.props.stage}`,
      this,
      {
        zoneId: this.zone.id,
      }
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
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token.includes('getZone'))
      return {
        ...args.inputs,
        id: 'mock-zone-id',
        zoneId: 'mock-zone-id',
        name: args.inputs?.filter?.name ?? 'mock-zone',
      }
    return args.inputs
  },
})

let stack = new TestCommonCloudflareStack('test-stack', testStackProps)

describe('TestCloudflareCommonConstruct', () => {
  expect(stack.construct.zone).toBeDefined()
  test('provisions zone as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.zone.id,
          stack.construct.zone.urn,
          stack.construct.zone.name,
          stack.construct.zone.account,
        ])
        .apply(([id, urn, name, account]) => {
          expect(id).toEqual('test-zone-dev-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$cloudflare:index/zone:Zone::test-zone-dev'
          )
          expect(name).toEqual('gradientedge.io')
          expect(account.id).toEqual('test-account')
        })
    )
  })
})

describe('TestCloudflareCommonConstruct', () => {
  expect(stack.construct.zoneCacheReserve).toBeDefined()
  test('provisions zone cache reserve as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.zoneCacheReserve.id,
          stack.construct.zoneCacheReserve.urn,
          stack.construct.zoneCacheReserve.zoneId,
        ])
        .apply(([id, urn, zoneId]) => {
          expect(id).toEqual('test-zone-cache-reserve-dev-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$cloudflare:index/zoneCacheReserve:ZoneCacheReserve::test-zone-cache-reserve-dev'
          )
          expect(zoneId).toEqual('test-zone-dev-id')
        })
    )
  })
})

describe('TestCloudflareCommonConstruct - Stage Utilities', () => {
  test('isDevelopmentStage returns true for dev stage', () => {
    expect(stack.construct.isDevelopmentStage()).toBe(true)
  })

  test('isTestStage returns false for dev stage', () => {
    expect(stack.construct.isTestStage()).toBe(false)
  })

  test('isUatStage returns false for dev stage', () => {
    expect(stack.construct.isUatStage()).toBe(false)
  })

  test('isProductionStage returns false for dev stage', () => {
    expect(stack.construct.isProductionStage()).toBe(false)
  })

  test('fullyQualifiedDomainName is set correctly with subDomain', () => {
    // When skipStageForARecords is false, stage is prefixed to domain
    expect(stack.construct.fullyQualifiedDomainName).toBe('dev.gradientedge.io')
  })
})

describe('TestCloudflareCommonConstruct - Different Stages', () => {
  test('isTestStage returns true for tst stage', () => {
    const testStack = new TestCommonCloudflareStack('test-stack-tst', testStackProps)
    expect(testStack.construct.isTestStage()).toBe(false)
    expect(testStack.construct.isDevelopmentStage()).toBe(true)
  })

  test('provider is initialized correctly', () => {
    expect(stack.construct.provider).toBeDefined()
  })

  test('config is initialized correctly', () => {
    expect(stack.construct.config).toBeDefined()
  })

  test('all manager instances are initialized', () => {
    expect(stack.construct.accessManager).toBeDefined()
    expect(stack.construct.apiShieldManager).toBeDefined()
    expect(stack.construct.argoManager).toBeDefined()
    expect(stack.construct.filterManager).toBeDefined()
    expect(stack.construct.firewallManager).toBeDefined()
    expect(stack.construct.pageManager).toBeDefined()
    expect(stack.construct.recordManager).toBeDefined()
    expect(stack.construct.ruleSetManager).toBeDefined()
    expect(stack.construct.workerManager).toBeDefined()
    expect(stack.construct.zoneManager).toBeDefined()
  })
})

describe('TestCloudflareCommonConstruct - Error Handling', () => {
  test('resolveStack throws when stackName is empty', () => {
    expect(() => {
      stack.construct['resolveStack']('')
    }).toThrow('Stack name undefined')
  })

  test('resolveStack creates stack reference with valid name', () => {
    const stackRef = stack.construct['resolveStack']('valid-stack-name')
    expect(stackRef).toBeDefined()
  })
})
