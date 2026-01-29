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
    super(name, testStackProps)
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
