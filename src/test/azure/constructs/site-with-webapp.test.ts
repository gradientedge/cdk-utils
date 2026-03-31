import * as pulumi from '@pulumi/pulumi'
import {
  AzureLocation,
  CommonAzureStack,
  CommonAzureStackProps,
  Site,
  SiteWithWebApp,
  SiteWithWebAppProps,
} from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: TestAzureStackProps = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/config/dummy.json', 'src/test/azure/common/config/site-with-webapp.json'],
  location: AzureLocation.EastUS,
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/env',
} as TestAzureStackProps

const testStackPropsMinimal: TestAzureStackProps = {
  ...testStackProps,
  extraContexts: [
    'src/test/azure/common/config/dummy.json',
    'src/test/azure/common/config/site-with-webapp-minimal.json',
  ],
} as TestAzureStackProps

class TestCommonStack extends CommonAzureStack {
  declare props: any
  declare construct: TestSiteWithWebAppConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestSiteWithWebAppConstruct(props.name, this.props)
  }
}

class TestSiteWithWebAppConstruct extends SiteWithWebApp {
  declare props: SiteWithWebAppProps & TestAzureStackProps

  constructor(name: string, props: SiteWithWebAppProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.site = {} as Site
    this.initResources()
  }
}

class TestCommonStackMinimal extends CommonAzureStack {
  declare props: any
  declare construct: TestSiteWithWebAppMinimalConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackPropsMinimal)
    this.construct = new TestSiteWithWebAppMinimalConstruct(`${props.name}-minimal`, this.props)
  }
}

class TestSiteWithWebAppMinimalConstruct extends SiteWithWebApp {
  declare props: SiteWithWebAppProps & TestAzureStackProps

  constructor(name: string, props: SiteWithWebAppProps & TestAzureStackProps) {
    super(name, props)
    this.props = props
    this.site = {} as Site
    this.initResources()
  }

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createSiteAppServicePlan()
    this.createSiteStorageAccount()
    this.createSiteStorageContainer()
    this.createCodePackage()
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath ?? '',
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    if (args.type === 'azure-native:resources:ResourceGroup') {
      name = args.inputs.resourceGroupName
    } else if (args.type === 'azure-native:web:AppServicePlan') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:storage:StorageAccount') {
      name = args.inputs.accountName
    } else if (args.type === 'azure-native:storage:BlobContainer') {
      name = args.inputs.containerName
    } else if (args.type === 'azure-native:web:WebApp') {
      name = args.inputs.name
    } else if (args.type === 'azure-native:monitor:DiagnosticSetting') {
      name = args.inputs.name
    }

    return {
      id: `${args.name}-id`,
      state: { ...args.inputs, name },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token.includes('archive')) {
      return {
        source: args.inputs.sourceDir ?? 'dist',
        outputPath: args.inputs.outputPath ?? 'dist/app.zip',
        outputSize: 1024,
        outputBase64sha256: 'mock-hash',
      }
    }
    return args.inputs
  },
})

const stack = new TestCommonStack('test-common-stack', testStackProps)
const stackMinimal = new TestCommonStackMinimal('test-minimal-stack', testStackPropsMinimal)

describe('TestSiteWithWebAppConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })

  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.site).toBeDefined()
    expect(stack.construct.site.appServicePlan).toBeDefined()
    expect(stack.construct.site.storageAccount).toBeDefined()
    expect(stack.construct.site.storageContainer).toBeDefined()
    expect(stack.construct.site.codeArchiveFile).toBeDefined()
    expect(stack.construct.site.environmentVariables).toBeDefined()
    expect(stack.construct.site.webApp).toBeDefined()
  })

  test('provisions site app service plan as expected', () => {
    pulumi
      .all([
        stack.construct.site.appServicePlan.id,
        stack.construct.site.appServicePlan.urn,
        stack.construct.site.appServicePlan.name,
        stack.construct.site.appServicePlan.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-app-service-plan-as-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:web:AppServicePlan::test-common-stack-app-service-plan-as'
        )
        expect(name).toEqual('test-site-plan-dev')
        expect(tags?.environment).toEqual('dev')
      })
  })

  test('provisions site storage account as expected', () => {
    pulumi
      .all([
        stack.construct.site.storageAccount.id,
        stack.construct.site.storageAccount.urn,
        stack.construct.site.storageAccount.name,
        stack.construct.site.storageAccount.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-storage-account-sa-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:StorageAccount::test-common-stack-storage-account-sa'
        )
        expect(name).toBeDefined()
        expect(tags?.environment).toEqual('dev')
      })
  })

  test('provisions site storage container as expected', () => {
    pulumi
      .all([
        stack.construct.site.storageContainer.id,
        stack.construct.site.storageContainer.urn,
        stack.construct.site.storageContainer.name,
      ])
      .apply(([id, urn, name]) => {
        expect(id).toEqual('test-common-stack-storage-deployment-container-sc-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::azure:test-common-stack$azure-native:storage:BlobContainer::test-common-stack-storage-deployment-container-sc'
        )
        expect(name).toBeDefined()
      })
  })

  test('provisions web app as expected', () => {
    pulumi
      .all([
        stack.construct.site.webApp.id,
        stack.construct.site.webApp.urn,
        stack.construct.site.webApp.name,
        stack.construct.site.webApp.tags,
      ])
      .apply(([id, urn, name, tags]) => {
        expect(id).toEqual('test-common-stack-web-app-lwa-id')
        expect(urn).toBeDefined()
        expect(name).toEqual('test-site-web-app-dev')
        expect(tags?.environment).toEqual('dev')
      })
  })

  test('creates site config environment variables as expected', () => {
    const envVars = stack.construct.site.environmentVariables
    expect(envVars).toBeDefined()
    expect(envVars.STAGE).toEqual('dev')
    expect(envVars.NODE_OPTIONS).toEqual('--max-old-space-size=4096')
    expect(envVars.NODE_ENV).toEqual('development')
    expect(envVars.BUILD_VERSION).toEqual('0.0.0')
    expect(envVars.ApplicationInsightsAgent_EXTENSION_VERSION).toEqual('~3')
    expect(envVars.OTEL_SDK_DISABLED).toEqual('false')
  })
})

describe('TestSiteWithWebAppMinimalConstruct', () => {
  test('synthesises minimal construct as expected', () => {
    expect(stackMinimal).toBeDefined()
    expect(stackMinimal.construct).toBeDefined()
    expect(stackMinimal.construct.site).toBeDefined()
    expect(stackMinimal.construct.site.appServicePlan).toBeDefined()
    expect(stackMinimal.construct.site.storageAccount).toBeDefined()
    expect(stackMinimal.construct.site.storageContainer).toBeDefined()
    expect(stackMinimal.construct.site.codeArchiveFile).toBeDefined()
  })

  test('does not create web app or environment variables when methods are not called', () => {
    expect(stackMinimal.construct.site.webApp).toBeUndefined()
    expect(stackMinimal.construct.site.environmentVariables).toBeUndefined()
  })
})
