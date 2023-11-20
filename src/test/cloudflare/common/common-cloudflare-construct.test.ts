import { WorkerCronTrigger } from '@cdktf/provider-cloudflare/lib/worker-cron-trigger'
import { WorkerDomain } from '@cdktf/provider-cloudflare/lib/worker-domain'
import { WorkerRoute } from '@cdktf/provider-cloudflare/lib/worker-route'
import { WorkerScript, WorkerScriptWebassemblyBinding } from '@cdktf/provider-cloudflare/lib/worker-script'
import { WorkersKv } from '@cdktf/provider-cloudflare/lib/workers-kv'
import { WorkersKvNamespace } from '@cdktf/provider-cloudflare/lib/workers-kv-namespace'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { ZoneCacheReserve } from '@cdktf/provider-cloudflare/lib/zone-cache-reserve'
import { ZoneCacheVariants } from '@cdktf/provider-cloudflare/lib/zone-cache-variants'
import { ZoneDnssec } from '@cdktf/provider-cloudflare/lib/zone-dnssec'
import { ZoneHold } from '@cdktf/provider-cloudflare/lib/zone-hold'
import { ZoneLockdown } from '@cdktf/provider-cloudflare/lib/zone-lockdown'
import { ZoneSettingsOverride } from '@cdktf/provider-cloudflare/lib/zone-settings-override'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import fs from 'fs'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  WorkerCronTriggerProps,
  WorkerDomainProps,
  WorkerRouteProps,
  WorkerScriptProps,
  WorkersKvNamespaceProps,
  WorkersKvProps,
  ZoneCacheVariantsProps,
  ZoneLockdownProps,
  ZoneProps,
  ZoneSettingsOverrideProps,
} from '../../../lib'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testZoneCacheVariants: ZoneCacheVariantsProps
  testZoneLockdown: ZoneLockdownProps
  testZoneSettingsOverride: ZoneSettingsOverrideProps
  testWorkerDomain: WorkerDomainProps
  testWorkerRoute: WorkerRouteProps
  testWorkerScript: WorkerScriptProps
  testWorkersKvNamespace: WorkersKvNamespaceProps
  testWorkersKv: WorkersKvProps
  testWorkerCronTrigger: WorkerCronTriggerProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/cdkConfig/dummy.json',
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
      testAttribute: this.node.tryGetContext('testAttribute'),
      testWorkerCronTrigger: this.node.tryGetContext('testWorkerCronTrigger'),
      testWorkerDomain: this.node.tryGetContext('testWorkerDomain'),
      testWorkerRoute: this.node.tryGetContext('testWorkerRoute'),
      testWorkerScript: this.node.tryGetContext('testWorkerScript'),
      testWorkersKv: this.node.tryGetContext('testWorkersKv'),
      testWorkersKvNamespace: this.node.tryGetContext('testWorkersKvNamespace'),
      testZone: this.node.tryGetContext('testZone'),
      testZoneCacheVariants: this.node.tryGetContext('testZoneCacheVariants'),
      testZoneLockdown: this.node.tryGetContext('testZoneLockdown'),
      testZoneSettingsOverride: this.node.tryGetContext('testZoneSettingsOverride'),
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
    this.zoneManager.createZoneCacheVariants(`test-zone-cache-variants-${this.props.stage}`, this, {
      ...this.props.testZoneCacheVariants,
    })
    this.zoneManager.createZoneDnssec(`test-zone-dnssec-${this.props.stage}`, this, {
      zoneId: zone.id,
    })
    this.zoneManager.createZoneHold(`test-zone-hold-${this.props.stage}`, this, {
      hold: true,
      zoneId: zone.id,
    })
    this.zoneManager.createZoneLockdown(`test-zone-lockdown-${this.props.stage}`, this, this.props.testZoneLockdown)
    this.zoneManager.createZoneSettingsOverride(
      `test-zone-settings-${this.props.stage}`,
      this,
      this.props.testZoneSettingsOverride
    )
    this.workerManager.createWorkerDomain(`test-worker-domain-${this.props.stage}`, this, this.props.testWorkerDomain)
    this.workerManager.createWorkerRoute(`test-worker-route-${this.props.stage}`, this, this.props.testWorkerRoute)
    const testScript = this.workerManager.createWorkerScript(`test-worker-script-${this.props.stage}`, this, {
      ...this.props.testWorkerScript,
      content: fs.readFileSync('src/test/cloudflare/common/sample.js', { encoding: 'utf8' }),
      webassemblyBinding: (this.props.testWorkerScript.webassemblyBinding as WorkerScriptWebassemblyBinding[]).map(
        (binding: WorkerScriptWebassemblyBinding) => {
          return {
            ...binding,
            module: fs.readFileSync('src/test/cloudflare/common/sample.wasm', { encoding: 'base64' }),
          }
        }
      ),
    })
    const workerKvNsId = this.workerManager.createWorkersKvNamespace(
      `test-workers-kv-ns-${this.props.stage}`,
      this,
      this.props.testWorkersKvNamespace
    )
    this.workerManager.createWorkersKv(`test-workers-kv-${this.props.stage}`, this, {
      ...this.props.testWorkersKv,
      namespaceId: workerKvNsId.id,
    })
    this.workerManager.createWorkerCronTrigger(
      `test-worker-trigger-${this.props.stage}`,
      this,
      this.props.testWorkerCronTrigger
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareCommonConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testWorkerDomainDevWorkerDomainFriendlyUniqueId: { value: 'test-worker-domain-dev' },
      testWorkerDomainDevWorkerDomainId: { value: '${cloudflare_worker_domain.test-worker-domain-dev.id}' },
      testWorkerRouteDevWorkerRouteFriendlyUniqueId: { value: 'test-worker-route-dev' },
      testWorkerRouteDevWorkerRouteId: { value: '${cloudflare_worker_route.test-worker-route-dev.id}' },
      testWorkerScriptDevWorkerScriptFriendlyUniqueId: { value: 'test-worker-script-dev' },
      testWorkerScriptDevWorkerScriptId: { value: '${cloudflare_worker_script.test-worker-script-dev.id}' },
      testWorkerTriggerDevWorkerCronTriggerFriendlyUniqueId: { value: 'test-worker-trigger-dev' },
      testWorkerTriggerDevWorkerCronTriggerId: {
        value: '${cloudflare_worker_cron_trigger.test-worker-trigger-dev.id}',
      },
      testWorkersKvDevWorkersKvFriendlyUniqueId: { value: 'test-workers-kv-dev' },
      testWorkersKvDevWorkersKvId: { value: '${cloudflare_workers_kv.test-workers-kv-dev.id}' },
      testWorkersKvNsDevWorkersKvNamespaceFriendlyUniqueId: { value: 'test-workers-kv-ns-dev' },
      testWorkersKvNsDevWorkersKvNamespaceId: {
        value: '${cloudflare_workers_kv_namespace.test-workers-kv-ns-dev.id}',
      },
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
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.zone}' },
      testZoneDnssecDevZoneDnssecFriendlyUniqueId: { value: 'test-zone-dnssec-dev' },
      testZoneDnssecDevZoneDnssecId: { value: '${cloudflare_zone_dnssec.test-zone-dnssec-dev.id}' },
      testZoneHoldDevZoneHoldFriendlyUniqueId: { value: 'test-zone-hold-dev' },
      testZoneHoldDevZoneHoldId: { value: '${cloudflare_zone_hold.test-zone-hold-dev.id}' },
      testZoneLockdownDevZoneLockdownFriendlyUniqueId: { value: 'test-zone-lockdown-dev' },
      testZoneLockdownDevZoneLockdownId: { value: '${cloudflare_zone_lockdown.test-zone-lockdown-dev.id}' },
      testZoneSettingsDevZoneSettingsOverrideFriendlyUniqueId: { value: 'test-zone-settings-dev' },
      testZoneSettingsDevZoneSettingsOverrideId: {
        value: '${cloudflare_zone_settings_override.test-zone-settings-dev.id}',
      },
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account_id: 'test-account',
      zone: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone cache reserve as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheReserve, {
      enabled: true,
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone cache variants as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneCacheVariants, {
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
      zone_id: '${data.cloudflare_zone.test-zone-cache-variants-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone dnssec as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneDnssec, {
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone hold as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneHold, {
      hold: true,
      zone_id: '${cloudflare_zone.test-zone-dev.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions zone lockdown as expected', () => {
    expect(construct).toHaveResourceWithProperties(ZoneLockdown, {
      configurations: {
        target: 'ip_range',
        value: '192.0.2.0/24',
      },
      paused: true,
      urls: ['gradientedge.io/api/product*'],
      zone_id: '${data.cloudflare_zone.test-zone-lockdown-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
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
      zone_id: '${data.cloudflare_zone.test-zone-settings-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerDomain, {
      account_id: 'test-account',
      hostname: 'test.gradientedge.io',
      service: 'product-service',
      zone_id: '${data.cloudflare_zone.test-worker-domain-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerRoute, {
      pattern: 'gradientedge.io/*',
      zone_id: '${data.cloudflare_zone.test-worker-route-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker script as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerScript, {
      account_id: 'test-account',
      analytics_engine_binding: [
        {
          dataset: 'sample_dataset',
          name: 'sample_dataset_binding',
        },
      ],
      content:
        'exports.handler = async function (event, context, callback) {\n  console.debug(`Event: ${JSON.stringify(event)}`)\n  console.debug(`Context: ${JSON.stringify(context)}`)\n  return callback(null, { statusCode: 200 })\n}\n',
      kv_namespace_binding: [
        {
          name: 'sample_kv_namespace_binding',
          namespace_id: 'sampleNamespaceId',
        },
      ],
      name: 'test-script-dev',
      plain_text_binding: [
        {
          name: 'sample_text_binding',
          text: 'example',
        },
      ],
      r2_bucket_binding: [
        {
          name: 'sample_bucket_binding',
        },
      ],
      secret_text_binding: [
        {
          name: 'sample_secret_text_binding',
          text: 'example',
        },
      ],
      service_binding: [
        {
          environment: 'development',
          name: 'sample_service_binding',
          service: 'sample_service',
        },
      ],
      webassembly_binding: [
        {
          module: 'AGFzbQEAAAABBQFgAAF/AgwBAmpzA3RibAFwAAIDAwIAAAkIAQBBAAsCAAEKDAIEAEEqCwUAQdMACw==',
          name: 'sample_wasm_binding',
        },
      ],
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions workers kv namespace as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkersKvNamespace, {
      account_id: 'test-account',
      title: 'test-namespace-dev',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions workers kv as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkersKv, {
      account_id: 'test-account',
      key: 'test',
      namespace_id: '${cloudflare_workers_kv_namespace.test-workers-kv-ns-dev.id}',
      value: 'test123',
    })
  })
})

describe('TestCloudflareCommonConstruct', () => {
  test('provisions worker cron trigger as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerCronTrigger, {
      account_id: 'test-account',
      schedules: ['*/5 * * * *', '10 7 * * mon-fri'],
    })
  })
})
