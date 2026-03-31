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

class TestCommonStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestSiteWithWebAppConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestSiteWithWebAppConstruct(
      props.name,
      this.props as unknown as SiteWithWebAppProps & TestAzureStackProps
    )
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

  public initResources() {
    this.createResourceGroup()
    this.resolveCommonLogAnalyticsWorkspace()
    this.resolveApplicationInsights()
    this.createSiteAppServicePlan()
    this.createSiteStorageAccount()
    this.createSiteStorageContainer()
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

describe('TestSiteWithWebAppConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestSiteWithWebAppConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.site).toBeDefined()
    expect(stack.construct.site.appServicePlan).toBeDefined()
    expect(stack.construct.site.storageAccount).toBeDefined()
    expect(stack.construct.site.storageContainer).toBeDefined()
  })
})

describe('TestSiteWithWebAppConstruct', () => {
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
})

describe('TestSiteWithWebAppConstruct', () => {
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
})

describe('TestSiteWithWebAppConstruct', () => {
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
})
