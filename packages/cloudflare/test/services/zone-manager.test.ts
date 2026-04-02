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
} from '../../src/index.js'

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
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:test-common-stack$cloudflare:index/zone:Zone::test-zone-dev'
        )
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
          'urn:pulumi:stack::project::cloudflare:test-common-stack$cloudflare:index/zoneCacheReserve:ZoneCacheReserve::test-zone-cache-reserve-dev'
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
          'urn:pulumi:stack::project::cloudflare:test-common-stack$cloudflare:index/zoneCacheVariants:ZoneCacheVariants::test-zone-cache-variants-dev'
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

class TestWithZoneIdCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestWithZoneIdConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestWithZoneIdConstruct(props.name, this.props)
  }
}

class TestWithZoneIdConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  zoneCacheReserve: ZoneCacheReserve
  zoneCacheVariants: ZoneCacheVariants
  zoneDnssec: ZoneDnssec
  zoneHold: ZoneHold
  zoneLockdown: ZoneLockdown
  zoneSetting: ZoneSetting
  zoneDnsSettings: ZoneSetting

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-zid-${this.props.stage}`, this, {
      ...this.props.testZone,
      account: { id: 'explicit-account' },
    })
    this.zoneCacheReserve = this.zoneManager.createZoneCacheReserve(
      `test-zone-cache-reserve-zid-${this.props.stage}`,
      this,
      {
        zoneId: this.zone.id,
      }
    )
    this.zoneCacheVariants = this.zoneManager.createZoneCacheVariants(
      `test-zone-cache-variants-zid-${this.props.stage}`,
      this,
      {
        ...this.props.testZoneCacheVariants,
        zoneId: this.zone.id,
      }
    )
    this.zoneDnssec = this.zoneManager.createZoneDnssec(`test-zone-dnssec-zid-${this.props.stage}`, this, {
      zoneId: this.zone.id,
    })
    this.zoneHold = this.zoneManager.createZoneHold(`test-zone-hold-zid-${this.props.stage}`, this, {
      zoneId: this.zone.id,
    })
    this.zoneLockdown = this.zoneManager.createZoneLockdown(`test-zone-lockdown-zid-${this.props.stage}`, this, {
      ...this.props.testZoneLockdown,
      zoneId: this.zone.id,
    })
    this.zoneSetting = this.zoneManager.createZoneSetting(`test-zone-settings-zid-${this.props.stage}`, this, {
      ...this.props.testZoneSetting,
      zoneId: this.zone.id,
    })
    this.zoneDnsSettings = this.zoneManager.createZoneDnsSettings(
      `test-zone-dns-settings-zid-${this.props.stage}`,
      this,
      {
        ...this.props.testZoneSetting,
        zoneId: this.zone.id,
      }
    )
  }
}

describe('TestCloudflareZoneManager - With explicit zoneId', () => {
  let zoneIdStack: TestWithZoneIdCloudflareStack
  test('provisions zone resources with explicit zoneId', () => {
    zoneIdStack = new TestWithZoneIdCloudflareStack('test-zoneid-stack', testStackProps)
    expect(zoneIdStack.construct.zone).toBeDefined()
    expect(zoneIdStack.construct.zoneCacheReserve).toBeDefined()
    expect(zoneIdStack.construct.zoneCacheVariants).toBeDefined()
    expect(zoneIdStack.construct.zoneDnssec).toBeDefined()
    expect(zoneIdStack.construct.zoneHold).toBeDefined()
    expect(zoneIdStack.construct.zoneLockdown).toBeDefined()
    expect(zoneIdStack.construct.zoneSetting).toBeDefined()
    expect(zoneIdStack.construct.zoneDnsSettings).toBeDefined()
  })

  test('zone cache variants uses provided zoneId', () => {
    pulumi.all([zoneIdStack.construct.zoneCacheVariants.zoneId]).apply(([zoneId]) => {
      expect(zoneId).toEqual('test-zone-zid-dev-id')
    })
  })

  test('zone setting uses provided zoneId', () => {
    pulumi.all([zoneIdStack.construct.zoneSetting.zoneId]).apply(([zoneId]) => {
      expect(zoneId).toEqual('test-zone-zid-dev-id')
    })
  })
})

class TestNoZoneIdCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestNoZoneIdConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestNoZoneIdConstruct(props.name, this.props)
  }
}

class TestNoZoneIdConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  zoneDnssec: ZoneDnssec
  zoneHold: ZoneHold
  zoneLockdown: ZoneLockdown
  zoneDnsSettings: ZoneSetting

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-nozid-${this.props.stage}`, this, this.props.testZone)
    this.zoneDnssec = this.zoneManager.createZoneDnssec(`test-zone-dnssec-nozid-${this.props.stage}`, this, {} as any)
    this.zoneHold = this.zoneManager.createZoneHold(`test-zone-hold-nozid-${this.props.stage}`, this, {} as any)
    this.zoneLockdown = this.zoneManager.createZoneLockdown(`test-zone-lockdown-nozid-${this.props.stage}`, this, {
      ...this.props.testZoneLockdown,
    })
    this.zoneDnsSettings = this.zoneManager.createZoneDnsSettings(
      `test-zone-dns-settings-nozid-${this.props.stage}`,
      this,
      {
        ...this.props.testZoneSetting,
      }
    )
  }
}

describe('TestCloudflareZoneManager - Without explicit zoneId (fallback)', () => {
  test('provisions zone resources with resolved zoneId', () => {
    const noZoneIdStack = new TestNoZoneIdCloudflareStack('test-nozid-stack', testStackProps)
    expect(noZoneIdStack.construct.zoneDnssec).toBeDefined()
    expect(noZoneIdStack.construct.zoneHold).toBeDefined()
    expect(noZoneIdStack.construct.zoneLockdown).toBeDefined()
    expect(noZoneIdStack.construct.zoneDnsSettings).toBeDefined()
  })
})

describe('TestCloudflareZoneManager - resolveZone', () => {
  test('resolves zone with default options', () => {
    const construct = stack.construct
    const resolvedZone = construct.zoneManager.resolveZone('test-resolve-zone', construct)
    expect(resolvedZone).toBeDefined()
  })

  test('resolves zone with custom filter name', () => {
    const construct = stack.construct
    const resolvedZone = construct.zoneManager.resolveZone('test-resolve-zone-custom', construct, {
      filter: { name: 'custom.gradientedge.io' },
    })
    expect(resolvedZone).toBeDefined()
  })
})

describe('TestCloudflareZoneManager - Undefined props', () => {
  test('throws error when zone hold props are undefined', () => {
    const construct = stack.construct
    expect(() => construct.zoneManager.createZoneHold('test-zone-hold-no-props', construct, undefined as any)).toThrow(
      'Props undefined for test-zone-hold-no-props'
    )
  })

  test('throws error when zone lockdown props are undefined', () => {
    const construct = stack.construct
    expect(() =>
      construct.zoneManager.createZoneLockdown('test-zone-lockdown-no-props', construct, undefined as any)
    ).toThrow('Props undefined for test-zone-lockdown-no-props')
  })

  test('throws error when zone dns settings props are undefined', () => {
    const construct = stack.construct
    expect(() =>
      construct.zoneManager.createZoneDnsSettings('test-zone-dns-no-props', construct, undefined as any)
    ).toThrow('Props undefined for test-zone-dns-no-props')
  })

  test('throws error when zone setting props are undefined', () => {
    const construct = stack.construct
    expect(() =>
      construct.zoneManager.createZoneSetting('test-zone-setting-no-props', construct, undefined as any)
    ).toThrow('Props undefined for test-zone-setting-no-props')
  })
})
