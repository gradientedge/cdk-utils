import { Zone, ZoneCacheReserve } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneProps,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/cloudflare/common/config/dummy.json', 'src/test/cloudflare/common/config/zone.json'],
  features: {},
  name: 'test-common-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/cloudflare/common/env',
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

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

let stack = new TestCommonCloudflareStack('test-stack', testStackProps)

describe('TestCloudflareCommonConstruct', () => {
  expect(stack.construct.zone).toBeDefined()
  test('provisions zone as expected', () => {
    pulumi
      .all([stack.construct.zone.id, stack.construct.zone.urn, stack.construct.zone.name, stack.construct.zone.account])
      .apply(([id, urn, name, account]) => {
        expect(id).toEqual('test-zone-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/zone:Zone::test-zone-dev'
        )
        expect(name).toEqual('gradientedge.io')
        expect(account.id).toEqual('test-account')
      })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  expect(stack.construct.zoneCacheReserve).toBeDefined()
  test('provisions zone cache reserve as expected', () => {
    pulumi
      .all([
        stack.construct.zoneCacheReserve.id,
        stack.construct.zoneCacheReserve.urn,
        stack.construct.zoneCacheReserve.zoneId,
      ])
      .apply(([id, urn, zoneId]) => {
        expect(id).toEqual('test-zone-cache-reserve-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/zoneCacheReserve:ZoneCacheReserve::test-zone-cache-reserve-dev'
        )
        expect(zoneId).toEqual('test-zone-dev-id')
      })
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

  test('fullyQualifiedDomainName is set correctly without subDomain', () => {
    // When skipStageForARecords is false, stage is prefixed to domain
    expect(stack.construct.fullyQualifiedDomainName).toBe('dev.gradientedge.io')
  })

  test('fullyQualifiedDomainName is set correctly without subDomain', () => {
    // Use a stage without context file to avoid subDomain being set by context
    const stackNoSubdomain = new TestCommonCloudflareStack('test-stack-no-subdomain', {
      ...testStackProps,
      stage: 'nonexistent',
      skipStageForARecords: true,
    })
    expect(stackNoSubdomain.construct.fullyQualifiedDomainName).toBe('gradientedge.io')
  })
})

describe('TestCloudflareCommonConstruct - Different Stages', () => {
  test('isTestStage returns true for tst stage', () => {
    const testStack = new TestCommonCloudflareStack('test-stack-tst', {
      ...testStackProps,
      stage: 'tst',
    })
    expect(testStack.construct.isTestStage()).toBe(true)
    expect(testStack.construct.isDevelopmentStage()).toBe(false)
  })

  test('isUatStage returns true for uat stage', () => {
    const uatStack = new TestCommonCloudflareStack('test-stack-uat', {
      ...testStackProps,
      stage: 'uat',
    })
    expect(uatStack.construct.isUatStage()).toBe(true)
    expect(uatStack.construct.isDevelopmentStage()).toBe(false)
  })

  test('isProductionStage returns true for prd stage', () => {
    const prdStack = new TestCommonCloudflareStack('test-stack-prd', {
      ...testStackProps,
      stage: 'prd',
    })
    expect(prdStack.construct.isProductionStage()).toBe(true)
    expect(prdStack.construct.isDevelopmentStage()).toBe(false)
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
