import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneCacheReserve } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve'
import { ZoneCacheVariants } from '@cdktf/provider-cloudflare/lib/zone-cache-variants'
import { ZoneDnssec } from '@cdktf/provider-cloudflare/lib/zone-dnssec'
import { ZoneHold } from '@cdktf/provider-cloudflare/lib/zone-hold'
import { ZoneLockdown } from '@cdktf/provider-cloudflare/lib/zone-lockdown'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneCacheVariantsProps,
  ZoneLockdownProps,
  ZoneProps,
  ZoneSettingsOverrideProps,
} from '../../../lib'
import { ZoneSettingsOverride } from '@cdktf/provider-cloudflare/lib/zone-settings-override'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testZoneCacheVariants: ZoneCacheVariantsProps
  testZoneLockdown: ZoneLockdownProps
  testZoneSettingsOverride: ZoneSettingsOverrideProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/cloudflare/common/cdkConfig/dummy.json', 'src/test/cloudflare/common/cdkConfig/zone.json'],
  features: {},
  name: 'test-common-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, props.name, this.props)
  }

  protected determineConstructProps(props: CommonCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testZone: this.node.tryGetContext('testZone'),
      testZoneCacheVariants: this.node.tryGetContext('testZoneCacheVariants'),
      testZoneLockdown: this.node.tryGetContext('testZoneLockdown'),
      testZoneSettingsOverride: this.node.tryGetContext('testZoneSettingsOverride'),
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, props)
    const zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneManager.createZoneCacheReserve(`test-zone-cache-reserve-${this.props.stage}`, this, {
      enabled: true,
      zoneId: zone.id,
    })
    this.zoneManager.createZoneCacheVariants(`test-zone-cache-variants-${this.props.stage}`, this, {
      ...this.props.testZoneCacheVariants,
    })
    this.zoneManager.createZoneDnssec(`test-zone-dnssec-${this.props.stage}`, this, {
      zoneId: zone.id,
    })
    this.zoneManager.createZoneHold(`test-zone-hold-${this.props.stage}`, this, {
      hold: true,
      zoneId: zone.id,
    })
    this.zoneManager.createZoneLockdown(`test-zone-lockdown-${this.props.stage}`, this, this.props.testZoneLockdown)
    this.zoneManager.createZoneSettingsOverride(
      `test-zone-settings-${this.props.stage}`,
      this,
      this.props.testZoneSettingsOverride
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareCommonConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testZoneCacheReserveDevZoneCacheReserveFriendlyUniqueId: { value: 'test-zone-cache-reserve-dev' },
      testZoneCacheReserveDevZoneCacheReserveId: {
        value: '${cloudflare_zone_cache_reserve.test-zone-cache-reserve-dev.id}',
      },
      testZoneCacheVariantsDevZoneCacheVariantsFriendlyUniqueId: { value: 'test-zone-cache-variants-dev' },
      testZoneCacheVariantsDevZoneCacheVariantsId: {
        value: '${cloudflare_zone_cache_variants.test-zone-cache-variants-dev.id}',
      },
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.zone}' },
      testZoneDnssecDevZoneDnssecFriendlyUniqueId: { value: 'test-zone-dnssec-dev' },
      testZoneDnssecDevZoneDnssecId: { value: '${cloudflare_zone_dnssec.test-zone-dnssec-dev.id}' },
      testZoneHoldDevZoneHoldFriendlyUniqueId: { value: 'test-zone-hold-dev' },
      testZoneHoldDevZoneHoldId: { value: '${cloudflare_zone_hold.test-zone-hold-dev.id}' },
      testZoneLockdownDevZoneLockdownFriendlyUniqueId: { value: 'test-zone-lockdown-dev' },
      testZoneLockdownDevZoneLockdownId: { value: '${cloudflare_zone_lockdown.test-zone-lockdown-dev.id}' },
      testZoneSettingsDevZoneSettingsOverrideFriendlyUniqueId: { value: 'test-zone-settings-dev' },
      testZoneSettingsDevZoneSettingsOverrideId: {
        value: '${cloudflare_zone_settings_override.test-zone-settings-dev.id}',
      },
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account_id: 'test-account',
      zone: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone cache reserve as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheReserve, {
      enabled: true,
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone cache variants as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheVariants, {
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
      zone_id: '${data.cloudflare_zone.test-zone-cache-variants-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone dnssec as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneDnssec, {
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone hold as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneHold, {
      hold: true,
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone lockdown as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneLockdown, {
      configurations: {
        target: 'ip_range',
        value: '192.0.2.0/24',
      },
      paused: true,
      urls: ['gradientedge.io/api/product*'],
      zone_id: '${data.cloudflare_zone.test-zone-lockdown-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone settings override as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneSettingsOverride, {
      settings: {
        automatic_https_rewrites: 'on',
        brotli: 'on',
        challenge_ttl: 2700,
        minify: {
          css: 'on',
          html: 'off',
          js: 'off',
        },
        mirage: 'on',
        opportunistic_encryption: 'on',
        security_header: {
          enabled: true,
        },
        security_level: 'high',
        waf: 'on',
      },
      zone_id: '${data.cloudflare_zone.test-zone-settings-dev-data-zone-data-zone.id}',
    })
  })
})
