import { Filter } from '@cdktf/provider-cloudflare/lib/filter'
import { FirewallRule } from '@cdktf/provider-cloudflare/lib/firewall-rule'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  ArgoProps,
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneProps,
} from '../../../lib'
import { Argo } from '@cdktf/provider-cloudflare/lib/argo'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testArgo: ArgoProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/cdkConfig/dummy.json',
    'src/test/cloudflare/common/cdkConfig/argo.json',
    'src/test/cloudflare/common/cdkConfig/zone.json',
  ],
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
      testArgo: this.node.tryGetContext('testArgo'),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testZone: this.node.tryGetContext('testZone'),
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
      testZone: this.node.tryGetContext('testZone'),
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
    const filter = this.argoManager.createArgo(`test-argo-${this.props.stage}`, this, this.props.testArgo)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareArgoManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-argo-dev')
  })
})

describe('TestCloudflareArgoManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareArgoManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareArgoManager', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testArgoDevArgoFriendlyUniqueId: { value: 'test-argo-dev' },
      testArgoDevArgoId: { value: '${cloudflare_argo.test-argo-dev.id}' },
      testZoneCacheReserveDevZoneCacheReserveFriendlyUniqueId: { value: 'test-zone-cache-reserve-dev' },
      testZoneCacheReserveDevZoneCacheReserveId: {
        value: '${cloudflare_zone_cache_reserve.test-zone-cache-reserve-dev.id}',
      },
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.zone}' },
    })
  })
})

describe('TestCloudflareArgoManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account_id: 'test-account',
      zone: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareArgoManager', () => {
  test('provisions argo as expected', () => {
    expect(construct).toHaveResourceWithProperties(Argo, {
      smart_routing: 'on',
      tiered_caching: 'on',
      zone_id: '${data.cloudflare_zone.test-argo-dev-data-zone-data-zone.id}',
    })
  })
})
