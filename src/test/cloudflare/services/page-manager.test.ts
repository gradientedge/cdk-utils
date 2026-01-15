import { PageRule, PagesDomain, PagesProject } from '@pulumi/cloudflare'
import * as pulumi from '@pulumi/pulumi'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  PageRuleProps,
  PagesDomainProps,
  PagesProjectProps,
  ZoneProps,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testPagesProject: PagesProjectProps
  testPagesProjectBuildConfig: PagesProjectProps
  testPagesDomain: PagesDomainProps
  testPageRule: PageRuleProps
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/cloudflare/common/cdkConfig/dummy.json', 'src/test/cloudflare/common/cdkConfig/pages.json'],
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
      testPageRule: undefined,
    }
  }
}

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps
  pagesProject: PagesProject
  pagesProjectWithBuild: PagesProject
  pagesDomain: PagesDomain
  pageRule: PageRule

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.pagesProject = this.pageManager.createPagesProject(
      `test-pages-project-${this.props.stage}`,
      this,
      this.props.testPagesProject
    )
    this.pagesProjectWithBuild = this.pageManager.createPagesProject(
      `test-pages-project-with-build-${this.props.stage}`,
      this,
      this.props.testPagesProjectBuildConfig
    )
    this.pagesDomain = this.pageManager.createPagesDomain(`test-pages-domain-${this.props.stage}`, this, {
      ...this.props.testPagesDomain,
      projectName: `test-pages-project-${this.props.stage}`,
    })
    this.pageRule = this.pageManager.createPageRule(`test-page-rule-${this.props.stage}`, this, this.props.testPageRule)
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

describe('TestCloudflarePagesManager', () => {
  test('handles mis-configurations as expected', () => {
    expect(() => new TestInvalidCommonCloudflareStack('test-stack', testStackProps)).toThrow()
  })
})

describe('TestCloudflarePagesManager', () => {
  expect(stack.construct.pagesProject).toBeDefined()
  test('provisions pages project as expected', () => {
    pulumi
      .all([
        stack.construct.pagesProject.id,
        stack.construct.pagesProject.urn,
        stack.construct.pagesProject.accountId,
        stack.construct.pagesProject.name,
        stack.construct.pagesProject.productionBranch,
      ])
      .apply(([id, urn, accountId, name, productionBranch]) => {
        expect(id).toEqual('test-pages-project-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/pagesProject:PagesProject::test-pages-project-dev'
        )
        expect(accountId).toEqual('123456789012')
        expect(name).toEqual('test-simple-project-dev')
        expect(productionBranch).toEqual('main')
      })
  })

  expect(stack.construct.pagesProjectWithBuild).toBeDefined()
  test('provisions pages project as expected', () => {
    pulumi
      .all([
        stack.construct.pagesProjectWithBuild.id,
        stack.construct.pagesProjectWithBuild.urn,
        stack.construct.pagesProjectWithBuild.accountId,
        stack.construct.pagesProjectWithBuild.name,
        stack.construct.pagesProjectWithBuild.productionBranch,
        stack.construct.pagesProjectWithBuild.buildConfig,
        stack.construct.pagesProjectWithBuild.deploymentConfigs,
      ])
      .apply(([id, urn, accountId, name, productionBranch, buildConfig, deploymentConfigs]) => {
        expect(id).toEqual('test-pages-project-with-build-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/pagesProject:PagesProject::test-pages-project-with-build-dev'
        )
        expect(accountId).toEqual('123456789012')
        expect(name).toEqual('test-build-config-project-dev')
        expect(productionBranch).toEqual('main')
        expect(buildConfig).toEqual({
          buildCommand: 'npm run build',
          destinationDir: 'dist',
          rootDir: '',
        })
        expect(deploymentConfigs).toEqual({
          preview: {
            compatibility_date: '2023-11-23',
            compatibility_flags: ['nodejs_compat'],
            envVars: {
              TEST_ENV_VAR: {
                type: 'plain_text',
                value: 'preview',
              },
              TEST_SECRET: {
                type: 'secret_text',
                value: '0987654321',
              },
            },
          },
          production: {
            compatibility_date: '2023-11-23',
            compatibility_flags: ['nodejs_compat'],
            envVars: {
              TEST_ENV_VAR: {
                type: 'plain_text',
                value: 'production',
              },
              TEST_SECRET: {
                type: 'secret_text',
                value: '1234567890',
              },
            },
          },
        })
      })
  })
})

describe('TestCloudflarePagesManager', () => {
  expect(stack.construct.pagesDomain).toBeDefined()
  test('provisions pages domain as expected', () => {
    pulumi
      .all([
        stack.construct.pagesDomain.id,
        stack.construct.pagesDomain.urn,
        stack.construct.pagesDomain.accountId,
        stack.construct.pagesDomain.name,
        stack.construct.pagesDomain.projectName,
      ])
      .apply(([id, urn, accountId, name, projectName]) => {
        expect(id).toEqual('test-pages-domain-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::cloudflare:index/pagesDomain:PagesDomain::test-pages-domain-dev'
        )
        expect(accountId).toEqual('123456789012')
        expect(name).toEqual('gradientedge.io')
        expect(projectName).toEqual('test-pages-project-dev')
      })
  })
})

describe('TestCloudflarePagesManager', () => {
  expect(stack.construct.pageRule).toBeDefined()
  test('provisions page rule as expected', () => {
    pulumi
      .all([
        stack.construct.pageRule.id,
        stack.construct.pageRule.urn,
        stack.construct.pageRule.actions,
        stack.construct.pageRule.priority,
        stack.construct.pageRule.target,
        stack.construct.pageRule.zoneId,
      ])
      .apply(([id, urn, actions, priority, target, zoneId]) => {
        expect(id).toEqual('test-page-rule-dev-id')
        expect(urn).toEqual('urn:pulumi:stack::project::cloudflare:index/pageRule:PageRule::test-page-rule-dev')
        expect(actions).toEqual({
          emailObfuscation: 'on',
          ssl: 'flexible',
        })
        expect(priority).toEqual(1)
        expect(target).toEqual('test.gradientedge.io/p/*')
        expect(zoneId).toEqual('test-page-rule-dev-data-zone')
      })
  })
})
