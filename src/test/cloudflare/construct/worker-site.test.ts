import * as pulumi from '@pulumi/pulumi'
import {
  CloudflareWorkerSite,
  CloudflareWorkerSiteProps,
  CommonCloudflareStack,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CloudflareWorkerSiteProps {
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/config/dummy.json',
    'src/test/cloudflare/common/config/rule-set.json',
    'src/test/cloudflare/common/config/worker.json',
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

  protected determineConstructProps(props: TestCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      siteWorkerAsset: `src/test/cloudflare/common/sample.html`,
      siteSubDomain: `test.app`,
    }
  }
}

class TestInvalidCommonCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }

  protected determineConstructProps(props: TestCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      siteWorkerDomain: undefined,
    }
  }
}

class TestCommonConstruct extends CloudflareWorkerSite {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.initResources()
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

describe('TestCloudflareWorkerSite', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareWorkerSite', () => {
  expect(stack.construct.siteZone).toBeDefined()
  test('provisions zone as expected', () => {
    pulumi
      .all([
        stack.construct.siteZone.id,
        stack.construct.siteZone.urn,
        stack.construct.siteZone.name,
        stack.construct.siteZone.account,
      ])
      .apply(([id, urn, name, account]) => {
        expect(id).toEqual('test-common-stack-zone-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/zone:Zone::test-common-stack-zone')
        expect(name).toEqual('gradientedge.io')
        expect(account.id).toEqual('test-account')
      })
  })
})

describe('TestCloudflareWorkerSite', () => {
  expect(stack.construct.siteWorkerScript).toBeDefined()
  test('provisions worker script as expected', () => {
    pulumi
      .all([
        stack.construct.siteWorkerScript.id,
        stack.construct.siteWorkerScript.urn,
        stack.construct.siteWorkerScript.accountId,
        stack.construct.siteWorkerScript.bindings,
        stack.construct.siteWorkerScript.content,
        stack.construct.siteWorkerScript.scriptName,
      ])
      .apply(([id, urn, accountId, bindings, content, scriptName]) => {
        expect(id).toEqual('test-common-stack-worker-script-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/workersScript:WorkersScript::test-common-stack-worker-script'
        )
        expect(accountId).toEqual('test-account')
        expect(bindings).toEqual([])
        expect(content).toBeDefined()
        expect(scriptName).toEqual('test-script-dev')
      })
  })
})

describe('TestCloudflareWorkerSite', () => {
  expect(stack.construct.siteWorkerDomain).toBeDefined()
  test('provisions workers custom domain as expected', () => {
    pulumi
      .all([
        stack.construct.siteWorkerDomain.id,
        stack.construct.siteWorkerDomain.urn,
        stack.construct.siteWorkerDomain.accountId,
        stack.construct.siteWorkerDomain.hostname,
        stack.construct.siteWorkerDomain.service,
        stack.construct.siteWorkerDomain.zoneId,
      ])
      .apply(([id, urn, accountId, hostname, service, zoneId]) => {
        expect(id).toEqual('test-common-stack-worker-domain-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/workersCustomDomain:WorkersCustomDomain::test-common-stack-worker-domain'
        )
        expect(accountId).toEqual('test-account')
        expect(hostname).toEqual('test.app.gradientedge.io')
        expect(service).toEqual('test-script-dev')
        expect(zoneId).toEqual('test-common-stack-worker-domain-data-zone')
      })
  })
})

describe('TestCloudflareWorkerSite', () => {
  expect(stack.construct.siteRuleSet).toBeDefined()
  test('provisions ruleset as expected', () => {
    pulumi
      .all([
        stack.construct.siteRuleSet.id,
        stack.construct.siteRuleSet.urn,
        stack.construct.siteRuleSet.name,
        stack.construct.siteRuleSet.rules,
      ])
      .apply(([id, urn, name, rules]) => {
        expect(id).toEqual('test-common-stack-rule-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/ruleset:Ruleset::test-common-stack-rule')
        expect(name).toEqual('testRuleSet')
        expect(rules).toEqual({
          action: 'set_cache_settings',
        })
      })
  })
})

describe('TestCloudflareWorkerSite', () => {
  expect(stack.construct.siteZoneSetting).toBeDefined()
  test('provisions zone settings override as expected', () => {
    pulumi
      .all([
        stack.construct.siteZoneSetting.id,
        stack.construct.siteZoneSetting.urn,
        stack.construct.siteZoneSetting.settingId,
        stack.construct.siteZoneSetting.value,
        stack.construct.siteZoneSetting.zoneId,
      ])
      .apply(([id, urn, settingId, value, zoneId]) => {
        expect(id).toEqual('test-common-stack-zone-setting-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/zoneSetting:ZoneSetting::test-common-stack-zone-setting'
        )
        expect(settingId).toEqual('always_online')
        expect(value).toEqual('on')
        expect(zoneId).toEqual('test-common-stack-zone-setting-data-zone')
      })
  })
})
