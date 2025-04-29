import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  ArgoSmartRoutingProps,
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneProps,
} from '../../../lib'
import { ArgoSmartRouting } from '@cdktf/provider-cloudflare/lib/argo-smart-routing'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testArgo: ArgoSmartRoutingProps
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
      zoneId: zone.id,
    })
    const filter = this.argoManager.createArgoSmartRouting(`test-argo-${this.props.stage}`, this, this.props.testArgo)
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
      testZoneCacheReserveDevZoneCacheReserveFriendlyUniqueId: { value: 'test-zone-cache-reserve-dev' },
      testZoneCacheReserveDevZoneCacheReserveId: {
        value: '${cloudflare_zone_cache_reserve.test-zone-cache-reserve-dev.id}',
      },
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.name}' },
    })
  })
})

describe('TestCloudflareArgoManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account: {
        id: 'test-account',
      },
      name: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareArgoManager', () => {
  test('provisions argo as expected', () => {
    expect(construct).toHaveResourceWithProperties(ArgoSmartRouting, {
      zone_id: '${data.cloudflare_zone.test-argo-dev-data-zone-data-zone.zone_id}',
    })
  })
})
