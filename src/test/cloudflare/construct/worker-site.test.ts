import { Ruleset } from '@cdktf/provider-cloudflare/lib/ruleset'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneSettingsOverride } from '@cdktf/provider-cloudflare/lib/zone-settings-override'
import { WorkerScript } from '@cdktf/provider-cloudflare/lib/worker-script'
import { WorkerDomain } from '@cdktf/provider-cloudflare/lib/worker-domain'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CloudflareWorkerSite,
  CloudflareWorkerSiteProps,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
} from '../../../lib'

interface TestCloudflareStackProps extends CloudflareWorkerSiteProps {
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/cdkConfig/dummy.json',
    'src/test/cloudflare/common/cdkConfig/rule-set.json',
    'src/test/cloudflare/common/cdkConfig/worker.json',
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
      siteWorkerAsset: `src/test/cloudflare/common/sample.html`,
      siteWorkerDomain: this.node.tryGetContext('testWorkerDomain'),
      siteRuleSet: this.node.tryGetContext('testRuleSet'),
      siteSubDomain: `test.app`,
      siteWorkerScript: this.node.tryGetContext('testWorkerScript'),
      siteZone: this.node.tryGetContext('testZone'),
      siteZoneSettingsOverride: this.node.tryGetContext('testZoneSettingsOverride'),
      testAttribute: this.node.tryGetContext('testAttribute'),
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
    }
  }
}

class TestCommonConstruct extends CloudflareWorkerSite {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, props)

    this.initResources()
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareWorkerSite', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-common-stack-zone')
  })
})

describe('TestCloudflareWorkerSite', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareWorkerSite', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareWorkerSite', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testCommonStackZoneZoneFriendlyUniqueId: { value: 'test-common-stack-zone' },
      testCommonStackZoneZoneId: { value: '${cloudflare_zone.test-common-stack-zone.id}' },
      testCommonStackZoneZoneName: { value: '${cloudflare_zone.test-common-stack-zone.zone}' },
    })
  })
})

describe('TestCloudflareWorkerSite', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account_id: 'test-account',
      zone: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareWorkerSite', () => {
  test('provisions worker as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerScript, {
      account_id: 'test-account',
      content: '${file("assets/test-common-stack-worker-content/DBA9E2ED0784B0A520C0C26867C9B2FF/sample.html")}',
      name: 'test-script-dev',
    })
  })
})

describe('TestCloudflareWorkerSite', () => {
  test('provisions worker domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerDomain, {
      account_id: 'test-account',
      hostname: 'test.app.gradientedge.io',
      service: '${cloudflare_worker_script.test-common-stack-worker-script.name}',
      zone_id: '${data.cloudflare_zone.test-common-stack-worker-domain-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareWorkerSite', () => {
  test('provisions Rule Set as expected', () => {
    expect(construct).toHaveResourceWithProperties(Ruleset, {
      name: 'testRuleSet',
      zone_id: '${data.cloudflare_zone.test-common-stack-rule-data-zone-data-zone.id}',
      rules: {
        action: 'set_cache_settings',
      },
    })
  })
})

describe('TestCloudflareWorkerSite', () => {
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
      zone_id: '${data.cloudflare_zone.test-common-stack-zone-settings-override-data-zone-data-zone.id}',
    })
  })
})
