import { DnsRecord } from '@cdktf/provider-cloudflare/lib/dns-record'
import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  DnsRecordProps,
  ZoneProps,
} from '../../../lib'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testARecord: DnsRecordProps
  testCNameRecord: DnsRecordProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/cdkConfig/dummy.json',
    'src/test/cloudflare/common/cdkConfig/record.json',
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
      testARecord: this.node.tryGetContext('testARecord'),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testCNameRecord: this.node.tryGetContext('testCNameRecord'),
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
      testZone: this.node.tryGetContext('testZone'),
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, props)
    this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.recordManager.createRecord(`test-arecord-${this.props.stage}`, this, this.props.testARecord)
    this.recordManager.createRecord(`test-cnamerecord-${this.props.stage}`, this, this.props.testCNameRecord)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflareRecordManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-arecord-dev')
  })
})

describe('TestCloudflareRecordManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflareRecordManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflareRecordManager', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testArecordDevRecordFriendlyUniqueId: { value: 'test-arecord-dev' },
      testArecordDevRecordId: { value: '${cloudflare_dns_record.test-arecord-dev.id}' },
      testCnamerecordDevRecordFriendlyUniqueId: { value: 'test-cnamerecord-dev' },
      testCnamerecordDevRecordId: { value: '${cloudflare_dns_record.test-cnamerecord-dev.id}' },
      testZoneDevZoneFriendlyUniqueId: { value: 'test-zone-dev' },
      testZoneDevZoneId: { value: '${cloudflare_zone.test-zone-dev.id}' },
      testZoneDevZoneName: { value: '${cloudflare_zone.test-zone-dev.name}' },
    })
  })
})

describe('TestCloudflareRecordManager', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account: {
        id: 'test-account',
      },
      name: 'gradientedge.io',
    })
  })
})

describe('TestCloudflareRecordManager', () => {
  test('provisions ARecord as expected', () => {
    expect(construct).toHaveResourceWithProperties(DnsRecord, {
      name: 'testARecord',
      ttl: 300,
      type: 'A',
      content: '192.0.2.1',
      zone_id: '${data.cloudflare_zone.test-arecord-dev-data-zone-data-zone.id}',
    })
    expect(construct).toHaveResourceWithProperties(DnsRecord, {
      name: 'testCNameRecord',
      ttl: 300,
      type: 'CNAME',
      content: 'example.gradientedge.io',
      zone_id: '${data.cloudflare_zone.test-cnamerecord-dev-data-zone-data-zone.id}',
    })
  })
})
