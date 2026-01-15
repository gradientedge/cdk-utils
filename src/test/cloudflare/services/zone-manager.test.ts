import {
  Zone,
  ZoneCacheReserve,
  ZoneCacheVariants,
  ZoneDnssec,
  ZoneHold,
  ZoneLockdown,
  ZoneSetting,
} from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneCacheVariantsProps,
  ZoneLockdownProps,
  ZoneProps,
  ZoneSettingProps,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testZoneCacheVariants: ZoneCacheVariantsProps
  testZoneLockdown: ZoneLockdownProps
  testZoneSetting: ZoneSettingProps
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

class TestInvalidCommonCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }

  protected determineConstructProps(props: CommonCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      testZone: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  zoneCacheVariants: ZoneCacheVariants
  zoneDnssec: ZoneDnssec
  zoneHold: ZoneHold
  zoneLockdown: ZoneLockdown
  zoneSetting: ZoneSetting
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
    this.zoneCacheVariants = this.zoneManager.createZoneCacheVariants(
      `test-zone-cache-variants-${this.props.stage}`,
      this,
      {
        ...this.props.testZoneCacheVariants,
      }
    )
    this.zoneDnssec = this.zoneManager.createZoneDnssec(`test-zone-dnssec-${this.props.stage}`, this, {
      zoneId: this.zone.id,
    })
    this.zoneHold = this.zoneManager.createZoneHold(`test-zone-hold-${this.props.stage}`, this, {
      zoneId: this.zone.id,
    })
    this.zoneLockdown = this.zoneManager.createZoneLockdown(
      `test-zone-lockdown-${this.props.stage}`,
      this,
      this.props.testZoneLockdown
    )
    this.zoneSetting = this.zoneManager.createZoneSetting(
      `test-zone-settings-${this.props.stage}`,
      this,
      this.props.testZoneSetting
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

describe('TestCloudflareZoneManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareZoneManager', () => {
  expect(stack.construct.zone).toBeDefined()
  test('provisions zone as expected', () => {
    pulumi
      .all([stack.construct.zone.id, stack.construct.zone.urn, stack.construct.zone.name, stack.construct.zone.account])
      .apply(([id, urn, name, account]) => {
        expect(id).toEqual('test-zone-dev-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/zone:Zone::test-zone-dev')
        expect(name).toEqual('gradientedge.io')
        expect(account.id).toEqual('test-account')
      })
  })
})

describe('TestCloudflareZoneManager', () => {
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
          'urn:pulumi:stack::project::cloudflare:index/zoneCacheReserve:ZoneCacheReserve::test-zone-cache-reserve-dev'
        )
        expect(zoneId).toEqual('test-zone-dev-id')
      })
  })
})

describe('TestCloudflareZoneManager', () => {
  expect(stack.construct.zoneCacheVariants).toBeDefined()
  test('provisions zone cache variants as expected', () => {
    pulumi
      .all([
        stack.construct.zoneCacheVariants.id,
        stack.construct.zoneCacheVariants.urn,
        stack.construct.zoneCacheVariants.value,
        stack.construct.zoneCacheVariants.zoneId,
      ])
      .apply(([id, urn, value, zoneId]) => {
        expect(id).toEqual('test-zone-cache-variants-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zoneCacheVariants:ZoneCacheVariants::test-zone-cache-variants-dev'
        )
        expect(value).toEqual({
          avif: ['image/avif', 'image/webp'],
          bmp: ['image/bmp', 'image/webp'],
          gif: ['image/gif', 'image/webp'],
          jp2: ['image/jp2', 'image/webp'],
          jpeg: ['image/jpeg', 'image/webp'],
          jpg: ['image/jpg', 'image/webp'],
          jpg2: ['image/jpg2', 'image/webp'],
          png: ['image/png', 'image/webp'],
          tif: ['image/tif', 'image/webp'],
          tiff: ['image/tiff', 'image/webp'],
          webp: ['image/jpeg', 'image/webp'],
        })
        expect(zoneId).toEqual('test-zone-cache-variants-dev-data-zone')
      })
  })
})
