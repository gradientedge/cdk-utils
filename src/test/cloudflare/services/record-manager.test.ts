import { DnsRecord, Zone } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  DnsRecordProps,
  ZoneProps,
} from '../../../lib/cloudflare/index.js'

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
      testARecord: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  zone: Zone
  aRecord: DnsRecord
  cnameRecord: DnsRecord

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.zone = this.zoneManager.createZone(`test-zone-${this.props.stage}`, this, this.props.testZone)
    this.aRecord = this.recordManager.createRecord(`test-arecord-${this.props.stage}`, this, this.props.testARecord)
    this.cnameRecord = this.recordManager.createRecord(
      `test-cnamerecord-${this.props.stage}`,
      this,
      this.props.testCNameRecord
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

describe('TestCloudflareRecordManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflareRecordManager', () => {
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

describe('TestCloudflareRecordManager', () => {
  expect(stack.construct.aRecord).toBeDefined()
  test('provisions A record as expected', () => {
    pulumi
      .all([
        stack.construct.aRecord.id,
        stack.construct.aRecord.urn,
        stack.construct.aRecord.name,
        stack.construct.aRecord.ttl,
        stack.construct.aRecord.type,
        stack.construct.aRecord.content,
        stack.construct.aRecord.zoneId,
      ])
      .apply(([id, urn, name, ttl, type, content, zoneId]) => {
        expect(id).toEqual('test-arecord-dev-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/dnsRecord:DnsRecord::test-arecord-dev')
        expect(name).toEqual('testARecord')
        expect(ttl).toEqual(300)
        expect(type).toEqual('A')
        expect(content).toEqual('192.0.2.1')
        expect(zoneId).toEqual('test-arecord-dev-data-zone')
      })
  })

  expect(stack.construct.cnameRecord).toBeDefined()
  test('provisions CNAME record as expected', () => {
    pulumi
      .all([
        stack.construct.cnameRecord.id,
        stack.construct.cnameRecord.urn,
        stack.construct.cnameRecord.name,
        stack.construct.cnameRecord.ttl,
        stack.construct.cnameRecord.type,
        stack.construct.cnameRecord.content,
        stack.construct.cnameRecord.zoneId,
      ])
      .apply(([id, urn, name, ttl, type, content, zoneId]) => {
        expect(id).toEqual('test-cnamerecord-dev-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/dnsRecord:DnsRecord::test-cnamerecord-dev')
        expect(name).toEqual('testCNameRecord')
        expect(ttl).toEqual(300)
        expect(type).toEqual('CNAME')
        expect(content).toEqual('example.gradientedge.io')
        expect(zoneId).toEqual('test-cnamerecord-dev-data-zone')
      })
  })
})
