import { WorkerCronTrigger } from '@cdktf/provider-cloudflare/lib/worker-cron-trigger'
import { WorkerDomain } from '@cdktf/provider-cloudflare/lib/worker-domain'
import { WorkerRoute } from '@cdktf/provider-cloudflare/lib/worker-route'
import { WorkerScript, WorkerScriptWebassemblyBinding } from '@cdktf/provider-cloudflare/lib/worker-script'
import { WorkersKv } from '@cdktf/provider-cloudflare/lib/workers-kv'
import { WorkersKvNamespace } from '@cdktf/provider-cloudflare/lib/workers-kv-namespace'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
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
  ZoneProps,
} from '../../../lib'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
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
      testWorkerCronTrigger: this.node.tryGetContext('testWorkerCronTrigger'),
      testWorkerRoute: this.node.tryGetContext('testWorkerRoute'),
      testWorkerScript: this.node.tryGetContext('testWorkerScript'),
      testWorkersKv: this.node.tryGetContext('testWorkersKv'),
      testWorkersKvNamespace: this.node.tryGetContext('testWorkersKvNamespace'),
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

describe('TestCloudflareWorkerManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-worker-domain-dev')
  })
})

describe('TestCloudflareWorkerManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareWorkerManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareWorkerManager', () => {
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
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.zone}' },
    })
  })
})

describe('TestCloudflareWorkerManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account_id: 'test-account',
      zone: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareWorkerManager', () => {
  test('provisions worker domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerDomain, {
      account_id: 'test-account',
      hostname: 'test.gradientedge.io',
      service: 'product-service',
      zone_id: '${data.cloudflare_zone.test-worker-domain-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareWorkerManager', () => {
  test('provisions worker domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerRoute, {
      pattern: 'gradientedge.io/*',
      zone_id: '${data.cloudflare_zone.test-worker-route-dev-data-zone-data-zone.id}',
    })
  })
})

describe('TestCloudflareWorkerManager', () => {
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

describe('TestCloudflareWorkerManager', () => {
  test('provisions workers kv namespace as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkersKvNamespace, {
      account_id: 'test-account',
      title: 'test-namespace-dev',
    })
  })
})

describe('TestCloudflareWorkerManager', () => {
  test('provisions workers kv as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkersKv, {
      account_id: 'test-account',
      key: 'test',
      namespace_id: '${cloudflare_workers_kv_namespace.test-workers-kv-ns-dev.id}',
      value: 'test123',
    })
  })
})

describe('TestCloudflareWorkerManager', () => {
  test('provisions worker cron trigger as expected', () => {
    expect(construct).toHaveResourceWithProperties(WorkerCronTrigger, {
      account_id: 'test-account',
      schedules: ['*/5 * * * *', '10 7 * * mon-fri'],
    })
  })
})
