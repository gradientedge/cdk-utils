import fs from 'fs'
import path from 'path'

import { Component, Workbook } from '@pulumi/azure-native/applicationinsights/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  ApplicationInsightsProps,
  AzureWorkbookRenderer,
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
  WorkbookProps,
} from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testApplicationInsights: ApplicationInsightsProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: [
    'packages/azure/test/common/config/dummy.json',
    'packages/azure/test/common/config/application-insights.json',
  ],
  features: {},
  location: 'eastus',
  name: 'test-common-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/env',
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
    return { ...baseProps, testApplicationInsights: undefined }
  }
}

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  applicationInsights: Component

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.applicationInsights = this.applicationInsightsManager.createComponent(
      `test-application-insights-${this.props.stage}`,
      this,
      this.props.testApplicationInsights
    )
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name = args.inputs.name

    // Return different names based on resource type
    if (args.type === 'azure-native:insights:Component') {
      name = args.inputs.resourceName
    }
    if (args.type === 'azure-native:applicationinsights:Workbook') {
      name = args.inputs.resourceName ?? args.name
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

describe('TestAzureApplicationInsightsConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack('test-invalid-stack', testStackProps)
    expect(error).toThrow('Props undefined for test-application-insights-dev')
  })
})

describe('TestAzureApplicationInsightsConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureApplicationInsightsConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.applicationInsights).toBeDefined()
  })
})

describe('TestAzureApplicationInsightsConstruct', () => {
  test('provisions application insights as expected', () => {
    pulumi
      .all([
        stack.construct.applicationInsights.id,
        stack.construct.applicationInsights.urn,
        stack.construct.applicationInsights.name,
        stack.construct.applicationInsights.location,
        stack.construct.applicationInsights.applicationType,
        stack.construct.applicationInsights.tags,
      ])
      .apply(([id, urn, name, location, applicationType, tags]) => {
        expect(id).toEqual('test-application-insights-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:applicationinsights:Component::test-application-insights-dev'
        )
        // expect(name).toEqual('test-application-insights-dev')
        expect(location).toEqual('eastus')
        expect(applicationType).toEqual('web')
        expect(tags?.environment).toEqual('dev')
      })
  })
})

/* --- Tests for billingFeatures branch --- */

class TestConstructWithBilling extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  applicationInsights: Component

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.applicationInsights = this.applicationInsightsManager.createComponent(
      `test-application-insights-billing-${this.props.stage}`,
      this,
      {
        ...this.props.testApplicationInsights,
        billingFeatures: {
          resourceName: 'test-billing-feature',
          resourceGroupName: 'test-rg-dev',
        },
      }
    )
  }
}

class TestStackWithBilling extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithBilling

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithBilling(props.name, this.props)
  }
}

const stackWithBilling = new TestStackWithBilling('test-billing-stack', testStackProps)

describe('TestAzureApplicationInsightsWithBillingFeatures', () => {
  test('provisions application insights with billing features', () => {
    expect(stackWithBilling.construct.applicationInsights).toBeDefined()
  })
})

/* --- Tests for createComponentCurrentBillingFeature error handling --- */

describe('TestAzureApplicationInsightsConstruct - createComponentCurrentBillingFeature', () => {
  test('throws when props are undefined', () => {
    expect(() => {
      stack.construct.applicationInsightsManager.createComponentCurrentBillingFeature(
        'test-billing-err',
        stack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-billing-err')
  })
})

/* --- Tests for createWorkbook --- */

const tmpDir = fs.mkdtempSync(path.join('/tmp', 'workbook-renderer-test-'))
const workbookOutputFile = path.join(tmpDir, 'test-workbook-workbook.json')
fs.writeFileSync(workbookOutputFile, JSON.stringify({ version: 'Notebook/1.0', items: [] }), 'utf-8')

const testWorkbookProps: WorkbookProps = {
  category: 'workbook',
  displayName: 'Test Workbook',
  serializedData: JSON.stringify({ version: 'Notebook/1.0', items: [] }),
  resourceGroupName: 'test-rg-dev',
  resourceName: 'test-workbook-id',
  location: 'eastus',
  kind: 'shared',
  description: 'A test workbook',
  tags: { environment: 'dev' },
  slug: 'test-workbook',
  templateId: 'test-template',
  variables: {},
}

const mockRenderer: AzureWorkbookRenderer = {
  renderToFile: () => workbookOutputFile,
} as unknown as AzureWorkbookRenderer

class TestConstructWithWorkbook extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  workbook: Workbook

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.workbook = this.applicationInsightsManager.createWorkbook(
      `test-workbook-${this.props.stage}`,
      this,
      testWorkbookProps,
      mockRenderer
    )
  }
}

class TestStackWithWorkbook extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestConstructWithWorkbook

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestConstructWithWorkbook(props.name, this.props)
  }
}

const stackWithWorkbook = new TestStackWithWorkbook('test-workbook-stack', testStackProps)

describe('TestAzureApplicationInsightsConstruct - createWorkbook', () => {
  test('throws when props are undefined', () => {
    expect(() => {
      stack.construct.applicationInsightsManager.createWorkbook('test-workbook-err', stack.construct, undefined as any)
    }).toThrow('Props undefined for test-workbook-err')
  })

  test('synthesises as expected', () => {
    expect(stackWithWorkbook).toBeDefined()
    expect(stackWithWorkbook.construct).toBeDefined()
    expect(stackWithWorkbook.construct.workbook).toBeDefined()
  })

  test('provisions workbook as expected', () => {
    pulumi
      .all([
        stackWithWorkbook.construct.workbook.id,
        stackWithWorkbook.construct.workbook.urn,
        stackWithWorkbook.construct.workbook.name,
        stackWithWorkbook.construct.workbook.category,
        stackWithWorkbook.construct.workbook.displayName,
        stackWithWorkbook.construct.workbook.serializedData,
        stackWithWorkbook.construct.workbook.location,
        stackWithWorkbook.construct.workbook.kind,
        stackWithWorkbook.construct.workbook.description,
      ])
      .apply(([id, urn, name, category, displayName, serializedData, location, kind, description]) => {
        expect(id).toEqual('test-workbook-dev-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:applicationinsights:Workbook::test-workbook-dev'
        )
        expect(name).toEqual('test-workbook-id')
        expect(category).toEqual('workbook')
        expect(displayName).toEqual('eastus - Test Workbook')
        expect(serializedData).toEqual(JSON.stringify({ version: 'Notebook/1.0', items: [] }))
        expect(location).toEqual('eastus')
        expect(kind).toEqual('shared')
        expect(description).toEqual('A test workbook')
      })
    stackWithWorkbook.construct.workbook.tags.apply(tags => {
      expect(tags).toEqual({ environment: 'dev' })
    })
  })
})
