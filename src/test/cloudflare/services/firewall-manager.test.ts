import { Filter, FirewallRule, Zone } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  FilterProps,
  ZoneProps,
} from '../../../lib/cloudflare/index.js'
import { FirewallRuleProps } from '../../../lib/cloudflare/services/firewall/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testFilter: FilterProps
  testFirewallRule: FirewallRuleProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/config/dummy.json',
    'src/test/cloudflare/common/config/filter.json',
    'src/test/cloudflare/common/config/firewall.json',
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
      testFilter: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  filter: Filter
  firewallRule: FirewallRule

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneManager.createZoneCacheReserve(`test-zone-cache-reserve-${this.props.stage}`, this, {
      zoneId: this.zone.id,
    })
    this.filter = this.filterManager.createFilter(`test-filter-${this.props.stage}`, this, this.props.testFilter)
    this.firewallRule = this.firewallManager.createFirewallRule(`test-firewall-rule-${this.props.stage}`, this, {
      ...this.props.testFirewallRule,
      filter: this.props.testFilter,
    })
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

describe('TestCloudflareFirewallManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareFirewallManager', () => {
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

describe('TestCloudflareFirewallManager', () => {
  expect(stack.construct.filter).toBeDefined()
  test('provisions filter as expected', () => {
    pulumi
      .all([
        stack.construct.filter.id,
        stack.construct.filter.urn,
        stack.construct.filter.bodies,
        stack.construct.filter.expression,
      ])
      .apply(([id, urn, bodies, expression]) => {
        expect(id).toEqual('test-filter-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/filter:Filter::test-filter-dev'
        )
        expect(bodies).toEqual([
          {
            description: 'Site break-in attempts that are outside of the office',
            expression:
              '(http.request.uri.path ~ ".*wp-login.php" or http.request.uri.path ~ ".*xmlrpc.php") and ip.src ne 192.0.2.1',
            paused: false,
          },
        ])
      })
  })
})

describe('TestCloudflareFirewallManager', () => {
  expect(stack.construct.filter).toBeDefined()
  test('provisions firewall rule as expected', () => {
    pulumi
      .all([
        stack.construct.firewallRule.id,
        stack.construct.firewallRule.urn,
        stack.construct.firewallRule.filter,
        stack.construct.firewallRule.zoneId,
      ])
      .apply(([id, urn, filter, zoneId]) => {
        expect(id).toEqual('test-firewall-rule-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/firewallRule:FirewallRule::test-firewall-rule-dev'
        )
        expect(filter).toEqual({
          bodies: [
            {
              description: 'Site break-in attempts that are outside of the office',
              expression:
                '(http.request.uri.path ~ ".*wp-login.php" or http.request.uri.path ~ ".*xmlrpc.php") and ip.src ne 192.0.2.1',
              paused: false,
            },
          ],
        })
        expect(zoneId).toEqual('test-firewall-rule-dev-data-zone')
      })
  })
})
