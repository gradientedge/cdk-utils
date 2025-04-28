import { Zone } from '@cdktf/provider-cloudflare/lib/zone'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CloudflarePagesStaticSite,
  CloudflarePagesStaticSiteProps,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
} from '../../../lib'
import { PagesProject } from '@cdktf/provider-cloudflare/lib/pages-project'
import { PagesDomain } from '@cdktf/provider-cloudflare/lib/pages-domain'
import { DnsRecord } from '@cdktf/provider-cloudflare/lib/dns-record'

interface TestCloudflareStackProps extends CloudflarePagesStaticSiteProps {
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/cdkConfig/dummy.json',
    'src/test/cloudflare/common/cdkConfig/pages.json',
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
      siteAssetDir: `src/test/cloudflare/common/sample.html`,
      siteCnameRecord: this.node.tryGetContext('testCNameRecord'),
      sitePagesProject: this.node.tryGetContext('testPagesProject'),
      siteSubDomain: `test.app`,
      siteZone: this.node.tryGetContext('testZone'),
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

class TestCommonConstruct extends CloudflarePagesStaticSite {
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

describe('TestCloudflarePagesStaticSite', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-common-stack-zone')
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testCommonStackSiteDomainPagesDomainFriendlyUniqueId: { value: 'test-common-stack-site-domain' },
      testCommonStackSiteDomainPagesDomainId: {
        value: '${cloudflare_pages_domain.test-common-stack-site-domain.id}',
      },
      testCommonStackSiteProjectPagesProjectFriendlyUniqueId: { value: 'test-common-stack-site-project' },
      testCommonStackSiteProjectPagesProjectId: {
        value: '${cloudflare_pages_project.test-common-stack-site-project.id}',
      },
      testCommonStackSiteRecordRecordFriendlyUniqueId: { value: 'test-common-stack-site-record' },
      testCommonStackSiteRecordRecordId: { value: '${cloudflare_dns_record.test-common-stack-site-record.id}' },
      testCommonStackZoneZoneFriendlyUniqueId: { value: 'test-common-stack-zone' },
      testCommonStackZoneZoneId: { value: '${cloudflare_zone.test-common-stack-zone.id}' },
      testCommonStackZoneZoneName: { value: '${cloudflare_zone.test-common-stack-zone.name}' },
    })
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  test('provisions zone as expected', () => {
    expect(construct).toHaveResourceWithProperties(Zone, {
      account: {
        id: 'test-account',
      },
      name: 'gradientedge.io',
    })
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  test('provisions pages project as expected', () => {
    expect(construct).toHaveResourceWithProperties(PagesProject, {
      account_id: '${var.accountId}',
      name: 'test-simple-project-dev',
      production_branch: 'main',
    })
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  test('provisions pages domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(PagesDomain, {
      account_id: '${var.accountId}',
      name: 'test.app.gradientedge.io',
      project_name: '${cloudflare_pages_project.test-common-stack-site-project.name}',
    })
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  test('provisions cname record as expected', () => {
    expect(construct).toHaveResourceWithProperties(DnsRecord, {
      content: 'example.gradientedge.io',
      data: {
        value: '${cloudflare_pages_project.test-common-stack-site-project.name}.pages.dev',
      },
      name: 'test.app',
      ttl: 300,
      type: 'CNAME',
      zone_id: '${data.cloudflare_zone.test-common-stack-site-record-data-zone-data-zone.zone_id}',
    })
  })
})
