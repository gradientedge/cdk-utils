import { Component } from '@pulumi/azure-native/applicationinsights/index.js'
import * as pulumi from '@pulumi/pulumi'
import {
  ApplicationInsightsProps,
  CommonAzureConstruct,
  CommonAzureStack,
  CommonAzureStackProps,
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
        expect(id).toEqual('test-application-insights-dev-ai-id')
        expect(urn).toEqual(
          'urn:pulumi:stack::project::construct:test-common-stack$azure-native:applicationinsights:Component::test-application-insights-dev-ai'
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
