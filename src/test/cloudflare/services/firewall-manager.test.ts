import { Filter } from '@cdktf/provider-cloudflare/lib/filter'
import { FirewallRule } from '@cdktf/provider-cloudflare/lib/firewall-rule'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  FilterProps,
  ZoneProps,
} from '../../../lib'
import { FirewallRuleProps } from '../../../lib/cloudflare/services/firewall'

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
    'src/test/cloudflare/common/cdkConfig/dummy.json',
    'src/test/cloudflare/common/cdkConfig/filter.json',
    'src/test/cloudflare/common/cdkConfig/firewall.json',
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
      testAttribute: this.node.tryGetContext('testAttribute'),
      testFilter: this.node.tryGetContext('testFilter'),
      testFirewallRule: this.node.tryGetContext('testFirewallRule'),
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
      testFirewallRule: this.node.tryGetContext('testFirewallRule'),
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
    const filter = this.filterManager.createApiShield(`test-filter-${this.props.stage}`, this, this.props.testFilter)
    this.firewallManager.createFirewallRule(`test-firewall-rule-${this.props.stage}`, this, {
      ...this.props.testFirewallRule,
      filter: {
        ...this.props.testFilter,
      },
    })
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareFirewallManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-filter-dev')
  })
})

describe('TestCloudflareFirewallManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareFirewallManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareFirewallManager', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testFilterDevFilterFriendlyUniqueId: { value: 'test-filter-dev' },
      testFilterDevFilterId: { value: '${cloudflare_filter.test-filter-dev.id}' },
      testFirewallRuleDevFirewallRuleFriendlyUniqueId: { value: 'test-firewall-rule-dev' },
      testFirewallRuleDevFirewallRuleId: { value: '${cloudflare_firewall_rule.test-firewall-rule-dev.id}' },
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.name}' },
    })
  })
})

describe('TestCloudflareFirewallManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account: {
        id: 'test-account',
      },
      name: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareFirewallManager', () => {
  test('provisions filter as expected', () => {
    expect(construct).toHaveResourceWithProperties(Filter, {
      expression:
        '(http.request.uri.path ~ ".*wp-login.php" or http.request.uri.path ~ ".*xmlrpc.php") and ip.src ne 192.0.2.1',
      zone_id: '${data.cloudflare_zone.test-filter-dev-data-zone-data-zone.zone_id}',
    })
  })
})

describe('TestCloudflareFirewallManager', () => {
  test('provisions firewall rule as expected', () => {
    expect(construct).toHaveResourceWithProperties(FirewallRule, {
      filter: {
        description: 'Site break-in attempts that are outside of the office',
        expression:
          '(http.request.uri.path ~ ".*wp-login.php" or http.request.uri.path ~ ".*xmlrpc.php") and ip.src ne 192.0.2.1',
        paused: false,
      },
      zone_id: '${data.cloudflare_zone.test-firewall-rule-dev-data-zone-data-zone.zone_id}',
    })
  })
})
