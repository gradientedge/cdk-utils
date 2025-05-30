import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneCacheReserve } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve'
import { ZoneCacheVariants } from '@cdktf/provider-cloudflare/lib/zone-cache-variants'
import { ZoneDnssec } from '@cdktf/provider-cloudflare/lib/zone-dnssec'
import { ZoneHold } from '@cdktf/provider-cloudflare/lib/zone-hold'
import { ZoneLockdown } from '@cdktf/provider-cloudflare/lib/zone-lockdown'
import { ZoneSetting } from '@cdktf/provider-cloudflare/lib/zone-setting'
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
  ZoneSettingProps,
} from '../../../lib'

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
      testZoneSetting: this.node.tryGetContext('testZoneSetting'),
    }
  }
}

class TestInvalidCommonStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, props.name, this.props)
  }

  protected determineConstructProps(props: CommonCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testZoneCacheVariants: this.node.tryGetContext('testZoneCacheVariants'),
      testZoneLockdown: this.node.tryGetContext('testZoneLockdown'),
      testZoneSetting: this.node.tryGetContext('testZoneSetting'),
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, props)
    const zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneManager.createZoneCacheReserve(`test-zone-cache-reserve-${this.props.stage}`, this, {
      zoneId: zone.id,
    })
    this.zoneManager.createZoneCacheVariants(`test-zone-cache-variants-${this.props.stage}`, this, {
      ...this.props.testZoneCacheVariants,
    })
    this.zoneManager.createZoneDnssec(`test-zone-dnssec-${this.props.stage}`, this, {
      zoneId: zone.id,
    })
    this.zoneManager.createZoneHold(`test-zone-hold-${this.props.stage}`, this, {
      zoneId: zone.id,
    })
    this.zoneManager.createZoneLockdown(`test-zone-lockdown-${this.props.stage}`, this, this.props.testZoneLockdown)
    this.zoneManager.createZoneSetting(`test-zone-settings-${this.props.stage}`, this, this.props.testZoneSetting)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareZoneManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-zone-dev')
  })
})

describe('TestCloudflareZoneManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareZoneManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareZoneManager', () => {
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
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.name}' },
      testZoneDnssecDevZoneDnssecFriendlyUniqueId: { value: 'test-zone-dnssec-dev' },
      testZoneDnssecDevZoneDnssecId: { value: '${cloudflare_zone_dnssec.test-zone-dnssec-dev.id}' },
      testZoneHoldDevZoneHoldFriendlyUniqueId: { value: 'test-zone-hold-dev' },
      testZoneHoldDevZoneHoldId: { value: '${cloudflare_zone_hold.test-zone-hold-dev.id}' },
      testZoneLockdownDevZoneLockdownFriendlyUniqueId: { value: 'test-zone-lockdown-dev' },
      testZoneLockdownDevZoneLockdownId: { value: '${cloudflare_zone_lockdown.test-zone-lockdown-dev.id}' },
    })
  })
})

describe('TestCloudflareZoneManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account: {
        id: 'test-account',
      },
      name: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareZoneManager', () => {
  test('provisions zone cache reserve as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheReserve, {
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareZoneManager', () => {
  test('provisions zone cache variants as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheVariants, {
      value: {
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
      },
      zone_id: '${data.cloudflare_zone.test-zone-cache-variants-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareZoneManager', () => {
  test('provisions zone dnssec as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneDnssec, {
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareZoneManager', () => {
  test('provisions zone hold as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneHold, {
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareZoneManager', () => {
  test('provisions zone lockdown as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneLockdown, {
      configurations: {
        target: 'ip_range',
        value: '192.0.2.0/24',
      },
      urls: ['gradientedge.io/api/product*'],
      zone_id: '${data.cloudflare_zone.test-zone-lockdown-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareZoneManager', () => {
  test('provisions zone settings override as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneSetting, {
      setting_id: 'always_online',
      value: 'on',
      zone_id: '${data.cloudflare_zone.test-zone-settings-dev-data-zone-data-zone.id}',
    })
  })
})
