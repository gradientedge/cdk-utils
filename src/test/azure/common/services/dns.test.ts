import { DnsZone } from '@cdktf/provider-azurerm/lib/dns-zone'
import { DnsARecord } from '@cdktf/provider-azurerm/lib/dns-a-record'
import { DnsCnameRecord } from '@cdktf/provider-azurerm/lib/dns-cname-record'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  DnsZoneProps,
  DnsARecordProps,
  DnsCnameRecordProps,
} from '../../../../lib'

interface TestAzureStackProps extends CommonAzureStackProps {
  testDnsZone: DnsZoneProps
  testDnsARecord: DnsARecordProps
  testDnsCnameRecord: DnsCnameRecordProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json', 'src/test/azure/common/cdkConfig/dns.json'],
  features: {},
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/aws/common/cdkEnv',
}

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, testStackProps)
    this.construct = new TestCommonConstruct(this, props.name, this.props)
  }

  protected determineConstructProps(props: CommonAzureStackProps) {
    return {
      ...super.determineConstructProps(props),
      testAttribute: this.node.tryGetContext('testAttribute'),
      testDnsZone: this.node.tryGetContext('testDnsZone'),
      testDnsARecord: this.node.tryGetContext('testDnsARecord'),
      testDnsCnameRecord: this.node.tryGetContext('testDnsCnameRecord'),
    }
  }
}

class TestInvalidCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(parent: Construct, name: string, props: TestAzureStackProps) {
    super(parent, name, props)
    this.dnsManager.createDnsZone(`test-dns-zone-${this.props.stage}`, this, this.props.testDnsZone)

    this.dnsManager.createDnsARecord(`test-dns-a-record-${this.props.stage}`, this, this.props.testDnsARecord)

    this.dnsManager.createDnsCnameRecord(
      `test-dns-cname-record-${this.props.stage}`,
      this,
      this.props.testDnsCnameRecord
    )
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

console.log(expect(construct).toHaveResourceWithProperties(DnsZone, {}))

describe('TestAzureDnsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-dns-zone-dev')
  })
})

describe('TestAzureDnsConstruct', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureDnsConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testDnsARecordDevDnsARecordFriendlyUniqueId: {
        value: 'test-dns-a-record-dev-da',
      },
      testDnsARecordDevDnsARecordId: {
        value: '${azurerm_dns_a_record.test-dns-a-record-dev-da.id}',
      },
      testDnsARecordDevDnsARecordName: {
        value: '${azurerm_dns_a_record.test-dns-a-record-dev-da.name}',
      },
      testDnsCnameRecordDevDnsCnameRecordFriendlyUniqueId: {
        value: 'test-dns-cname-record-dev-dc',
      },
      testDnsCnameRecordDevDnsCnameRecordId: {
        value: '${azurerm_dns_cname_record.test-dns-cname-record-dev-dc.id}',
      },
      testDnsCnameRecordDevDnsCnameRecordName: {
        value: '${azurerm_dns_cname_record.test-dns-cname-record-dev-dc.name}',
      },
      testDnsZoneDevDnsZoneFriendlyUniqueId: {
        value: 'test-dns-zone-dev-dz',
      },
      testDnsZoneDevDnsZoneId: {
        value: '${azurerm_dns_zone.test-dns-zone-dev-dz.id}',
      },
      testDnsZoneDevDnsZoneName: {
        value: '${azurerm_dns_zone.test-dns-zone-dev-dz.name}',
      },
    })
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions dns zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(DnsZone, {
      name: 'test-dns-zone-dev',
      resource_group_name: '${data.azurerm_resource_group.test-dns-zone-dev-am-rg.name}',
      tags: {
        environment: 'dev',
      },
    })
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions dns a record as expected', () => {
    expect(construct).toHaveResourceWithProperties(DnsARecord, {
      name: 'test-a-record-dev',
      records: 'test-record',
      resource_group_name: '${data.azurerm_dns_zone.test-dns-a-record-dev-da-dz.resource_group_name}',
      tags: {
        environment: 'dev',
      },
      ttl: 300,
      zone_name: '${data.azurerm_dns_zone.test-dns-a-record-dev-da-dz.name}',
    })
  })
})

describe('TestAzureDnsConstruct', () => {
  test('provisions dns cname record as expected', () => {
    expect(construct).toHaveResourceWithProperties(DnsCnameRecord, {
      name: 'test-cname-record-dev',
      resource_group_name: '${data.azurerm_dns_zone.test-dns-cname-record-dev-dc-dz.resource_group_name}',
      tags: {
        environment: 'dev',
      },
      ttl: 300,
      zone_name: '${data.azurerm_dns_zone.test-dns-cname-record-dev-dc-dz.name}',
    })
  })
})
