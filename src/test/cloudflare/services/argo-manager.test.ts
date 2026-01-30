import { ArgoSmartRouting, ArgoTieredCaching, Zone } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  ArgoSmartRoutingProps,
  ArgoTieredCachingProps,
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  ZoneProps,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testArgo: ArgoSmartRoutingProps
  testArgoTieredCaching: ArgoTieredCachingProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/config/dummy.json',
    'src/test/cloudflare/common/config/argo.json',
    'src/test/cloudflare/common/config/zone.json',
  ],
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
      testArgo: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  argoSmartRouting: ArgoSmartRouting
  argoTieredCaching: ArgoTieredCaching

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneManager.createZoneCacheReserve(`test-zone-cache-reserve-${this.props.stage}`, this, {
      zoneId: this.zone.id,
    })
    this.argoSmartRouting = this.argoManager.createArgoSmartRouting(
      `test-argo-${this.props.stage}`,
      this,
      this.props.testArgo
    )
    this.argoTieredCaching = this.argoManager.createArgoTieredCaching(
      `test-argo-tiered-caching-${this.props.stage}`,
      this,
      this.props.testArgoTieredCaching
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

describe('TestCloudflareArgoManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareArgoManager', () => {
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

describe('TestCloudflareArgoManager', () => {
  expect(stack.construct.argoSmartRouting).toBeDefined()
  test('provisions argo smart routing as expected', () => {
    pulumi
      .all([
        stack.construct.argoSmartRouting.id,
        stack.construct.argoSmartRouting.urn,
        stack.construct.argoSmartRouting.value,
      ])
      .apply(([id, urn, value]) => {
        expect(id).toEqual('test-argo-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/argoSmartRouting:ArgoSmartRouting::test-argo-dev'
        )
        expect(value).toEqual('on')
      })
  })
})

describe('TestCloudflareArgoManager', () => {
  expect(stack.construct.argoTieredCaching).toBeDefined()
  test('provisions argo tiered caching as expected', () => {
    pulumi
      .all([
        stack.construct.argoTieredCaching.id,
        stack.construct.argoTieredCaching.urn,
        stack.construct.argoTieredCaching.value,
      ])
      .apply(([id, urn, value]) => {
        expect(id).toEqual('test-argo-tiered-caching-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/argoTieredCaching:ArgoTieredCaching::test-argo-tiered-caching-dev'
        )
        expect(value).toEqual('on')
      })
  })
})
