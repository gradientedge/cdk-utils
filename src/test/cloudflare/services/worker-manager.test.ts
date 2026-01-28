import {
  WorkersCronTrigger,
  WorkersCustomDomain,
  WorkersKv,
  WorkersKvNamespace,
  WorkersRoute,
  WorkersScript,
  Zone,
  ZoneCacheReserve,
} from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
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
} from '../../../lib/cloudflare/index.js'

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
    'src/test/cloudflare/common/config/dummy.json',
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
      testWorkerCronTrigger: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  zoneCacheReserve: ZoneCacheReserve
  workersCustomDomain: WorkersCustomDomain
  workersRoute: WorkersRoute
  workersScript: WorkersScript
  workersKvNamespace: WorkersKvNamespace
  workersKv: WorkersKv
  workersCronTrigger: WorkersCronTrigger

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.zoneCacheReserve = this.zoneManager.createZoneCacheReserve(
      `test-zone-cache-reserve-${this.props.stage}`,
      this,
      {
        zoneId: this.zone.id,
      }
    )
    this.workersCustomDomain = this.workerManager.createWorkerDomain(
      `test-worker-domain-${this.props.stage}`,
      this,
      this.props.testWorkerDomain
    )
    this.workersRoute = this.workerManager.createWorkerRoute(
      `test-worker-route-${this.props.stage}`,
      this,
      this.props.testWorkerRoute
    )
    this.workersScript = this.workerManager.createWorkerScript(`test-worker-script-${this.props.stage}`, this, {
      ...this.props.testWorkerScript,
      content: fs.readFileSync('src/test/cloudflare/common/sample.js', { encoding: 'utf8' }),
    })
    this.workersKvNamespace = this.workerManager.createWorkersKvNamespace(
      `test-workers-kv-ns-${this.props.stage}`,
      this,
      this.props.testWorkersKvNamespace
    )
    this.workersKv = this.workerManager.createWorkersKv(`test-workers-kv-${this.props.stage}`, this, {
      ...this.props.testWorkersKv,
      namespaceId: this.workersKvNamespace.id,
    })
    this.workersCronTrigger = this.workerManager.createWorkerCronTrigger(
      `test-worker-trigger-${this.props.stage}`,
      this,
      this.props.testWorkerCronTrigger
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

describe('TestCloudflareWorkerManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareWorkerManager', () => {
  expect(stack.construct.zone).toBeDefined()
  test('provisions zone as expected', () => {
    pulumi
      .all([stack.construct.zone.id, stack.construct.zone.urn, stack.construct.zone.name, stack.construct.zone.account])
      .apply(([id, urn, name, account]) => {
        expect(id).toEqual('test-zone-dev-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/zone:Zone::test-zone-dev')
        expect(name).toEqual('gradientedge.io')
        expect(account.id).toEqual('test-account')
      })
  })
})

describe('TestCloudflareWorkerManager', () => {
  expect(stack.construct.workersCustomDomain).toBeDefined()
  test('provisions workers custom domain as expected', () => {
    pulumi
      .all([
        stack.construct.workersCustomDomain.id,
        stack.construct.workersCustomDomain.urn,
        stack.construct.workersCustomDomain.accountId,
        stack.construct.workersCustomDomain.hostname,
        stack.construct.workersCustomDomain.service,
        stack.construct.workersCustomDomain.zoneId,
      ])
      .apply(([id, urn, accountId, hostname, service, zoneId]) => {
        expect(id).toEqual('test-worker-domain-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/workersCustomDomain:WorkersCustomDomain::test-worker-domain-dev'
        )
        expect(accountId).toEqual('test-account')
        expect(hostname).toEqual('test.gradientedge.io')
        expect(service).toEqual('product-service')
        expect(zoneId).toEqual('test-worker-domain-dev-data-zone')
      })
  })
})
