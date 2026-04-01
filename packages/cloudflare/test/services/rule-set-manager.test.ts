import { Ruleset, Zone } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  RulesetProps,
  ZoneProps,
} from '../../src/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testRuleSet: RulesetProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/cloudflare/test/common/config/dummy.json',
    'packages/cloudflare/test/common/config/rule-set.json',
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
      testRuleSet: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  ruleSet: Ruleset

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.ruleSet = this.ruleSetManager.createRuleSet(`test-rule-set-${this.props.stage}`, this, this.props.testRuleSet)
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

describe('TestCloudflareRuleSetManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareRuleSetManager', () => {
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

describe('TestCloudflareRuleSetManager', () => {
  expect(stack.construct.ruleSet).toBeDefined()
  test('provisions ruleset as expected', () => {
    pulumi
      .all([
        stack.construct.ruleSet.id,
        stack.construct.ruleSet.urn,
        stack.construct.ruleSet.name,
        stack.construct.ruleSet.rules,
      ])
      .apply(([id, urn, name, rules]) => {
        expect(id).toEqual('test-rule-set-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:test-common-stack$cloudflare:index/ruleset:Ruleset::test-rule-set-dev'
        )
        expect(name).toEqual('testRuleSet')
        expect(rules).toEqual({
          action: 'set_cache_settings',
        })
      })
  })
})
