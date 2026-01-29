import { RecordSet, Zone } from '@pulumi/azure-native/dns/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  DnsARecordProps,
  DnsCnameRecordProps,
  DnsTxtRecordProps,
  DnsZoneProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testDnsZone: DnsZoneProps
  testDnsARecord: DnsARecordProps
  testDnsCnameRecord: DnsCnameRecordProps
  testDnsTxtRecord: DnsTxtRecordProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/dns.json'],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestCommonConstruct(props.name, this.props)
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestCommonConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestCommonConstruct(testStackProps.name, this.props)
  }

  protected determineConstructProps(props: TestAzureStackProps): TestAzureStackProps {
    const baseProps = super.determineConstructProps(props)
    // Override the test property to undefined to trigger validation error
    return { ...baseProps, testDnsZone: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  dnsZone: Zone
  dnsARecord: RecordSet
  dnsCnameRecord: RecordSet
  dnsTxtRecord: RecordSet

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.dnsZone = this.dnsManager.createDnsZone(`test-dns-zone-${this.props.stage}`, this, this.props.testDnsZone)

    this.dnsARecord = this.dnsManager.createDnsARecord(
      `test-dns-a-record-${this.props.stage}`,
      this,
      this.props.testDnsARecord
    )

    this.dnsCnameRecord = this.dnsManager.createDnsCnameRecord(
      `test-dns-cname-record-${this.props.stage}`,
      this,
      this.props.testDnsCnameRecord
    )

    this.dnsTxtRecord = this.dnsManager.createDnsTxtRecord(
      `test-dns-txt-record-${this.props.stage}`,
      this,
      this.props.testDnsTxtRecord
    )
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name = args.inputs.name

    // Return different names based on resource type
    if (args.type === 'azure-native:dns:Zone') {
      name = args.inputs.zoneName
    } else if (args.type === 'azure-native:dns:RecordSet') {
      name = args.inputs.relativeRecordSetName
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)

describe('TestAzureDnsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-dns-zone-dev')
  })
})

describe('TestAzureDnsConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureDnsConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.dnsZone).toBeDefined()
    expect(stack.construct.dnsARecord).toBeDefined()
    expect(stack.construct.dnsCnameRecord).toBeDefined()
    expect(stack.construct.dnsTxtRecord).toBeDefined()
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions dns zone as expected', () => {
    pulumi
      .all([
        stack.construct.dnsZone.id,
        stack.construct.dnsZone.urn,
        stack.construct.dnsZone.name,
        stack.construct.dnsZone.location,
        stack.construct.dnsZone.tags,
      ])
      .apply(([id, urn, name, location, tags]) => {
        expect(id).toEqual('test-dns-zone-dev-dz-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:dns:Zone::test-dns-zone-dev-dz'
        )
        expect(name).toEqual('test-dns-zone-dev')
        expect(location).toEqual('global')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions dns a record as expected', () => {
    pulumi
      .all([
        stack.construct.dnsARecord.id,
        stack.construct.dnsARecord.urn,
        stack.construct.dnsARecord.name,
        stack.construct.dnsARecord.aRecords,
        stack.construct.dnsARecord.ttl,
      ])
      .apply(([id, urn, name, aRecords, ttl]) => {
        expect(id).toEqual('test-dns-a-record-dev-da-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:dns:RecordSet::test-dns-a-record-dev-da'
        )
        expect(name).toEqual('test-a-record')
        expect(aRecords).toEqual([{ ipv4Address: '1.2.3.4' }])
        expect(ttl).toEqual(300)
      })
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions dns cname record as expected', () => {
    pulumi
      .all([
        stack.construct.dnsCnameRecord.id,
        stack.construct.dnsCnameRecord.urn,
        stack.construct.dnsCnameRecord.name,
        stack.construct.dnsCnameRecord.cnameRecord,
        stack.construct.dnsCnameRecord.ttl,
      ])
      .apply(([id, urn, name, cnameRecord, ttl]) => {
        expect(id).toEqual('test-dns-cname-record-dev-dc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:dns:RecordSet::test-dns-cname-record-dev-dc'
        )
        expect(name).toEqual('test-cname-record')
        expect(cnameRecord).toEqual({ cname: 'test.example.com' })
        expect(ttl).toEqual(300)
      })
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions dns txt record as expected', () => {
    pulumi
      .all([
        stack.construct.dnsTxtRecord.id,
        stack.construct.dnsTxtRecord.urn,
        stack.construct.dnsTxtRecord.name,
        stack.construct.dnsTxtRecord.txtRecords,
        stack.construct.dnsTxtRecord.ttl,
      ])
      .apply(([id, urn, name, txtRecords, ttl]) => {
        expect(id).toEqual('test-dns-txt-record-dev-dt-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:azure:Construct:test-common-stack$azure-native:dns:RecordSet::test-dns-txt-record-dev-dt'
        )
        expect(name).toEqual('test-txt-record')
        expect(txtRecords).toEqual([{ value: ['test-record'] }])
        expect(ttl).toEqual(300)
      })
  })
})
