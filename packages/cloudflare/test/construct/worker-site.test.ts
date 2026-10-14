import fs from 'fs'
import os from 'os'
import * as path from 'path'
import { fileURLToPath } from 'url'

import { GetZoneResult, Zone } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import { Output } from '@pulumi/pulumi'
import { vi } from 'vitest'
import { CloudflareWorkerSite, CloudflareWorkerSiteProps, CommonCloudflareStack } from '../../src/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sampleHtmlPath = path.relative(
  path.resolve(process.cwd(), '..'),
  path.resolve(__dirname, '../common/sample.html')
)

interface TestCloudflareStackProps extends CloudflareWorkerSiteProps {
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/cloudflare/test/common/config/dummy.json',
    'packages/cloudflare/test/common/config/rule-set.json',
    'packages/cloudflare/test/common/config/worker.json',
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

  protected determineConstructProps(props: TestCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      siteWorkerAsset: sampleHtmlPath,
      siteSubDomain: `test.app`,
    }
  }
}

class TestExistingZoneCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestExistingZoneConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestExistingZoneConstruct(props.name, this.props)
  }

  protected determineConstructProps(props: TestCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      siteWorkerAsset: sampleHtmlPath,
      siteSubDomain: `test.app`,
      useExistingZone: true,
    }
  }
}

class TestNoRuleSetCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestNoRuleSetConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestNoRuleSetConstruct(props.name, this.props)
  }

  protected determineConstructProps(props: TestCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      siteWorkerAsset: sampleHtmlPath,
      siteSubDomain: `test.app`,
      siteRuleSet: undefined,
      siteZoneSetting: undefined,
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

  public testResolveWorkerAssetPath() {
    this.resolveWorkerAssetPath()
  }

  public testTranslateWorkersBaseConfig() {
    this.translateWorkersBaseConfig()
  }
}

class TestExistingZoneConstruct extends CloudflareWorkerSite {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.initResources()
  }
}

class TestNoRuleSetConstruct extends CloudflareWorkerSite {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.initResources()
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
  'project:secretsProvider': 'none',
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token.includes('getZone'))
      return {
        ...args.inputs,
        id: 'mock-zone-id',
        zoneId: 'mock-zone-id',
        name: args.inputs?.filter?.name ?? 'mock-zone',
      }
    return args.inputs
  },
})

let stack = new TestCommonCloudflareStack('test-stack', testStackProps)

describe('TestCloudflareWorkerSite', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })

  test('only creates a workers.dev subdomain when configured', async () => {
    expect(stack.construct.siteWorkerSubdomain).toBeUndefined()
    const worker = new TestCommonConstruct('test-subdomain-worker', {
      ...stack.construct.props,
      siteWorkerSubdomain: {
        accountId: 'test-account',
        scriptName: 'test-script-dev',
        enabled: false,
        previewsEnabled: false,
      },
    })
    const accountId = worker.siteWorkerSubdomain.accountId as Output<string> & {
      promise: (withUnknowns?: boolean) => Promise<string>
    }
    const scriptName = worker.siteWorkerSubdomain.scriptName as Output<string> & {
      promise: (withUnknowns?: boolean) => Promise<string>
    }
    const enabled = worker.siteWorkerSubdomain.enabled as Output<boolean> & {
      promise: (withUnknowns?: boolean) => Promise<boolean>
    }
    const previewsEnabled = worker.siteWorkerSubdomain.previewsEnabled as Output<boolean> & {
      promise: (withUnknowns?: boolean) => Promise<boolean>
    }
    expect(await accountId.promise(true)).toBe('123456789012')
    expect(await scriptName.promise(true)).toBe('test-script-dev')
    expect(await enabled.promise(true)).toBe(false)
    expect(await previewsEnabled.promise(true)).toBe(false)
  })

  test('resolves the Worker asset from a dist working directory', () => {
    const originalAsset = stack.construct.props.siteWorkerAsset
    const workingDirectory = process.cwd()
    const expectedAsset = path.relative(workingDirectory, path.resolve(workingDirectory, '..', originalAsset))
    const cwd = vi.spyOn(process, 'cwd').mockReturnValue(path.join(workingDirectory, 'dist'))
    try {
      stack.construct.testResolveWorkerAssetPath()
      expect(stack.construct.props.siteWorkerAsset).toEqual(expectedAsset)
    } finally {
      cwd.mockRestore()
      stack.construct.props.siteWorkerAsset = originalAsset
    }
  })

  test('translates a base Wrangler JSONC config', () => {
    const configDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-site-config-'))
    const originalScript = stack.construct.props.siteWorkerScript
    const originalBindings = stack.construct.workerPlainTextBindingEnvironmentVariables
    fs.writeFileSync(
      path.join(configDirectory, 'wrangler.jsonc'),
      '{ // Worker base config\n "main": "worker.js", "compatibility_date": "2026-04-19", "vars": {"HELLO": "world"}, "assets": {"directory": "./public", "binding": "ASSETS", "not_found_handling": "404-page"} }'
    )
    try {
      stack.construct.props.siteWranglerConfig = configDirectory
      stack.construct.testTranslateWorkersBaseConfig()
      expect(stack.construct.props.siteWorkerScript.mainModule).toEqual('worker.js')
      expect(stack.construct.props.siteWorkerScript.compatibilityDate).toEqual('2026-04-19')
      const assets = stack.construct.props.siteWorkerScript.assets as { directory?: string } | undefined
      expect(assets?.directory).toEqual(path.join(configDirectory, 'public'))
      expect(stack.construct.workerPlainTextBindingEnvironmentVariables).toEqual([
        { name: 'HELLO', text: 'world', type: 'plain_text' },
        { name: 'ASSETS', type: 'assets' },
      ])
    } finally {
      stack.construct.props.siteWranglerConfig = undefined
      stack.construct.props.siteWorkerScript = originalScript
      stack.construct.workerPlainTextBindingEnvironmentVariables = originalBindings
      fs.rmSync(configDirectory, { recursive: true, force: true })
    }
  })
})

describe('TestCloudflareWorkerSite', () => {
  expect(stack.construct.siteZone).toBeDefined()
  test('provisions zone as expected', () => {
    const zone = stack.construct.siteZone as Zone
    pulumi.all([zone.id, zone.urn, zone.name]).apply(([id, urn, name]) => {
      expect(id).toBeDefined()
      expect(urn).toBeDefined()
      expect(name).toEqual('gradientedge.io')
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
          'urn:pulumi:stack::project::construct:test-common-stack$cloudflare:index/workersScript:WorkersScript::test-common-stack-worker-script'
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
          'urn:pulumi:stack::project::construct:test-common-stack$cloudflare:index/workersCustomDomain:WorkersCustomDomain::test-common-stack-worker-domain'
        )
        expect(accountId).toEqual('test-account')
        expect(hostname).toEqual('test.app.gradientedge.io')
        expect(service).toEqual('test-script-dev')
        expect(zoneId).toEqual('mock-zone-id')
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
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$cloudflare:index/ruleset:Ruleset::test-common-stack-rule'
        )
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
          'urn:pulumi:stack::project::construct:test-common-stack$cloudflare:index/zoneSetting:ZoneSetting::test-common-stack-zone-setting'
        )
        expect(settingId).toEqual('always_online')
        expect(value).toEqual('on')
        expect(zoneId).toEqual('mock-zone-id')
      })
  })
})

describe('TestCloudflareWorkerSite - useExistingZone', () => {
  test('resolves existing zone when useExistingZone is true', () => {
    const existingZoneStack = new TestExistingZoneCloudflareStack('test-existing-zone-stack', testStackProps)
    expect(existingZoneStack.construct.siteZone).toBeDefined()
    const zone = existingZoneStack.construct.siteZone as Output<GetZoneResult>
    pulumi.all([zone.id, zone.zoneId]).apply(([id, zoneId]) => {
      expect(id).toBeDefined()
      expect(zoneId).toBeDefined()
    })
  })
})

describe('TestCloudflareWorkerSite - No RuleSet or ZoneSetting', () => {
  test('skips ruleset and zone setting when not provided', () => {
    const noRuleSetStack = new TestNoRuleSetCloudflareStack('test-no-ruleset-stack', testStackProps)
    expect(noRuleSetStack.construct.siteRuleSet).toBeUndefined()
    expect(noRuleSetStack.construct.siteZoneSetting).toBeUndefined()
  })
})

class TestSecretsConstruct extends CloudflareWorkerSite {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.initResources()
  }

  public testResolveSecretFromAWS(secretName: string) {
    return this.resolveSecretFromAWS(secretName)
  }

  public testResolveSecretFromAzure(resourceGroupName: string, keyVaultName: string, secretKey: string) {
    return this.resolveSecretFromAzure(resourceGroupName, keyVaultName, secretKey)
  }
}

class TestSecretsCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestSecretsConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, testStackProps)
    this.construct = new TestSecretsConstruct(props.name, this.props)
  }

  protected determineConstructProps(props: TestCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      siteWorkerAsset: sampleHtmlPath,
      siteSubDomain: `test.app`,
    }
  }
}

describe('TestCloudflareWorkerSite - resolveSecretFromAWS', () => {
  test('returns undefined when secretsProvider is not aws', () => {
    const secretsStack = new TestSecretsCloudflareStack('test-secrets-aws-stack', testStackProps)
    const result = secretsStack.construct.testResolveSecretFromAWS('my-secret')
    expect(result).toBeUndefined()
  })
})

describe('TestCloudflareWorkerSite - resolveSecretFromAzure', () => {
  test('returns undefined when secretsProvider is not azure', () => {
    const secretsStack = new TestSecretsCloudflareStack('test-secrets-azure-stack', testStackProps)
    const result = secretsStack.construct.testResolveSecretFromAzure('my-rg', 'my-vault', 'my-secret')
    expect(result).toBeUndefined()
  })
})
