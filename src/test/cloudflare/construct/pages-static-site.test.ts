import * as pulumi from '@pulumi/pulumi'
import {
  CloudflarePagesStaticSite,
  CloudflarePagesStaticSiteProps,
  CommonCloudflareStack,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CloudflarePagesStaticSiteProps {
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: [
    'src/test/cloudflare/common/config/dummy.json',
    'src/test/cloudflare/common/config/pages.json',
    'src/test/cloudflare/common/config/record.json',
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

  protected determineConstructProps(props: TestCloudflareStackProps) {
    return {
      ...super.determineConstructProps(props),
      siteAssetDir: `src/test/cloudflare/common/sample.html`,
      siteSubDomain: `test.app`,
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
      sitePagesProject: undefined,
    }
  }
}

class TestCommonConstruct extends CloudflarePagesStaticSite {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.initResources()
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

describe('TestCloudflarePagesStaticSite', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  expect(stack.construct.siteZone).toBeDefined()
  test('provisions zone as expected', () => {
    pulumi
      .all([
        stack.construct.siteZone.id,
        stack.construct.siteZone.urn,
        stack.construct.siteZone.name,
        stack.construct.siteZone.account,
      ])
      .apply(([id, urn, name, account]) => {
        expect(id).toEqual('test-common-stack-zone-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/zone:Zone::test-common-stack-zone'
        )
        expect(name).toEqual('gradientedge.io')
        expect(account.id).toEqual('test-account')
      })
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  expect(stack.construct.sitePagesProject).toBeDefined()
  test('provisions pages project as expected', () => {
    pulumi
      .all([
        stack.construct.sitePagesProject.id,
        stack.construct.sitePagesProject.urn,
        stack.construct.sitePagesProject.accountId,
        stack.construct.sitePagesProject.name,
        stack.construct.sitePagesProject.productionBranch,
      ])
      .apply(([id, urn, accountId, name, productionBranch]) => {
        expect(id).toEqual('test-common-stack-site-project-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/pagesProject:PagesProject::test-common-stack-site-project'
        )
        expect(accountId).toEqual('123456789012')
        expect(name).toEqual('test-simple-project-dev')
        expect(productionBranch).toEqual('main')
      })
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  expect(stack.construct.sitePagesDomain).toBeDefined()
  test('provisions pages domain as expected', () => {
    pulumi
      .all([
        stack.construct.sitePagesDomain.id,
        stack.construct.sitePagesDomain.urn,
        stack.construct.sitePagesDomain.accountId,
        stack.construct.sitePagesDomain.name,
        stack.construct.sitePagesDomain.projectName,
      ])
      .apply(([id, urn, accountId, name, projectName]) => {
        expect(id).toEqual('test-common-stack-site-domain-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/pagesDomain:PagesDomain::test-common-stack-site-domain'
        )
        expect(accountId).toEqual('123456789012')
        expect(name).toEqual('test.app.gradientedge.io')
        expect(projectName).toEqual('test-simple-project-dev')
      })
  })
})

describe('TestCloudflarePagesStaticSite', () => {
  expect(stack.construct.sitePagesCnameRecord).toBeDefined()
  test('provisions CNAME record as expected', () => {
    pulumi
      .all([
        stack.construct.sitePagesCnameRecord.id,
        stack.construct.sitePagesCnameRecord.urn,
        stack.construct.sitePagesCnameRecord.name,
        stack.construct.sitePagesCnameRecord.ttl,
        stack.construct.sitePagesCnameRecord.type,
        stack.construct.sitePagesCnameRecord.content,
        stack.construct.sitePagesCnameRecord.zoneId,
      ])
      .apply(([id, urn, name, ttl, type, content, zoneId]) => {
        expect(id).toEqual('test-common-stack-site-record-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::custom:cloudflare:Construct:test-common-stack$cloudflare:index/dnsRecord:DnsRecord::test-common-stack-site-record'
        )
        expect(name).toEqual('test.app')
        expect(ttl).toEqual(300)
        expect(type).toEqual('CNAME')
        expect(content).toEqual('example.gradientedge.io')
        expect(zoneId).toEqual('test-common-stack-site-record-data-zone')
      })
  })
})
