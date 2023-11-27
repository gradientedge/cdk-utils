import { PageRule } from '@cdktf/provider-cloudflare/lib/page-rule'
import { PagesDomain } from '@cdktf/provider-cloudflare/lib/pages-domain'
import { PagesProject } from '@cdktf/provider-cloudflare/lib/pages-project'
import { App, Testing } from 'cdktf'
import 'cdktf/lib/testing/adapters/jest'
import { Construct } from 'constructs'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
  PageRuleProps,
  PagesDomainProps,
  PagesProjectProps,
  ZoneProps,
} from '../../../lib'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testZone: ZoneProps
  testPagesProject: PagesProjectProps
  testPagesProjectBuildConfig: PagesProjectProps
  testPagesProjectGithub: PagesProjectProps
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
      testPageRule: this.node.tryGetContext('testPageRule'),
      testPagesDomain: this.node.tryGetContext('testPagesDomain'),
      testPagesProject: this.node.tryGetContext('testPagesProject'),
      testPagesProjectBuildConfig: this.node.tryGetContext('testPagesProjectBuildConfig'),
      testPagesProjectGithub: this.node.tryGetContext('testPagesProjectGithub'),
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

class TestCommonConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps

  constructor(parent: Construct, name: string, props: TestCloudflareStackProps) {
    super(parent, name, props)
    this.pageManager.createPagesProject(`test-pages-project-${this.props.stage}`, this, this.props.testPagesProject)
    this.pageManager.createPagesProject(
      `test-pages-project-with-build-${this.props.stage}`,
      this,
      this.props.testPagesProjectBuildConfig
    )
    this.pageManager.createPagesProject(
      `test-pages-project-with-gh-${this.props.stage}`,
      this,
      this.props.testPagesProjectGithub
    )
    this.pageManager.createPagesDomain(`test-pages-domain-${this.props.stage}`, this, {
      ...this.props.testPagesDomain,
      projectName: `test-pages-project-${this.props.stage}`,
    })
    this.pageManager.createPageRule(`test-page-rule-${this.props.stage}`, this, this.props.testPageRule)
  }
}

const app = new App({ context: testStackProps })
const testingApp = Testing.fakeCdktfJsonPath(app)
const commonStack = new TestCommonStack(testingApp, 'test-common-stack', testStackProps)
const stack = Testing.fullSynth(commonStack)
const construct = Testing.synth(commonStack.construct)

describe('TestCloudflarePagesManager', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-pages-project-dev')
  })
})

describe('TestCloudflarePagesManager', () => {
  test('is initialised as expected', () => {
    /* test if the created stack have the right properties injected */
    expect(commonStack.props).toHaveProperty('testAttribute')
    expect(commonStack.props.testAttribute).toEqual('success')
  })
})

describe('TestCloudflarePagesManager', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(construct).toBeDefined()
    expect(stack).toBeValidTerraform()
    expect(stack).toPlanSuccessfully()
  })
})

describe('TestCloudflarePagesManager', () => {
  test('provisions outputs as expected', () => {
    expect(JSON.parse(construct).output).toMatchObject({
      testPageRuleDevPageRuleFriendlyUniqueId: { value: 'test-page-rule-dev' },
      testPageRuleDevPageRuleId: { value: '${cloudflare_page_rule.test-page-rule-dev.id}' },
      testPagesDomainDevPagesDomainFriendlyUniqueId: { value: 'test-pages-domain-dev' },
      testPagesDomainDevPagesDomainId: { value: '${cloudflare_pages_domain.test-pages-domain-dev.id}' },
      testPagesProjectDevPagesProjectFriendlyUniqueId: { value: 'test-pages-project-dev' },
      testPagesProjectDevPagesProjectId: { value: '${cloudflare_pages_project.test-pages-project-dev.id}' },
      testPagesProjectWithBuildDevPagesProjectFriendlyUniqueId: { value: 'test-pages-project-with-build-dev' },
      testPagesProjectWithBuildDevPagesProjectId: {
        value: '${cloudflare_pages_project.test-pages-project-with-build-dev.id}',
      },
      testPagesProjectWithGhDevPagesProjectFriendlyUniqueId: { value: 'test-pages-project-with-gh-dev' },
      testPagesProjectWithGhDevPagesProjectId: {
        value: '${cloudflare_pages_project.test-pages-project-with-gh-dev.id}',
      },
    })
  })
})

describe('TestCloudflarePagesManager', () => {
  test('provisions pages project as expected', () => {
    expect(construct).toHaveResourceWithProperties(PagesProject, {
      account_id: '${var.accountId}',
      name: 'test-simple-project-dev',
      production_branch: 'main',
    })
    expect(construct).toHaveResourceWithProperties(PagesProject, {
      account_id: '${var.accountId}',
      build_config: {
        build_command: 'npm run build',
        destination_dir: 'dist',
        root_dir: '',
      },
      deployment_configs: {
        preview: {
          environment_variables: {
            TEST_ENV_VAR: 'preview',
          },
          secrets: {
            TEST_SECRET: '0987654321',
          },
        },
        production: {
          environment_variables: {
            TEST_ENV_VAR: 'production',
          },
          secrets: {
            TEST_SECRET: '1234567890',
          },
        },
      },
      name: 'test-build-config-project-dev',
      production_branch: 'main',
    })
    expect(construct).toHaveResourceWithProperties(PagesProject, {
      account_id: '${var.accountId}',
      name: 'test-github-project-dev',
      production_branch: 'main',
      source: {
        config: {
          deployments_enabled: true,
          owner: 'test',
          pr_comments_enabled: true,
          preview_branch_excludes: ['main', 'production'],
          preview_branch_includes: ['dev', 'preview'],
          preview_deployment_setting: 'custom',
          production_branch: 'main',
          production_deployment_enabled: true,
          repo_name: 'test-github-project',
        },
        type: 'github',
      },
    })
  })
})

describe('TestCloudflarePagesManager', () => {
  test('provisions pages domain as expected', () => {
    expect(construct).toHaveResourceWithProperties(PagesDomain, {
      account_id: '${var.accountId}',
      domain: 'gradientedge.io',
      project_name: 'test-pages-project-dev',
    })
  })
})

describe('TestCloudflarePagesManager', () => {
  test('provisions page rule as expected', () => {
    expect(construct).toHaveResourceWithProperties(PageRule, {
      actions: {
        email_obfuscation: 'on',
        minify: {
          css: 'on',
          html: 'off',
          js: 'on',
        },
        ssl: 'flexible',
      },
      priority: 1,
      target: 'test.gradientedge.io/p/*',
      zone_id: '${data.cloudflare_zone.test-page-rule-dev-data-zone-data-zone.id}',
    })
  })
})
