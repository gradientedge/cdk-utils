import { LoadTest } from '@pulumi/azure-native/loadtestservice/index.js'
import * as pulumi from '@pulumi/pulumi'
import { outputToPromise } from '../helpers.js'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps, LoadTestProps } from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testLoadTest: LoadTestProps
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json', 'packages/azure/test/common/config/load-test.json'],
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

class TestCommonConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  loadTest: LoadTest

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.loadTest = this.loadTestManager.createLoadTest(`test-load-test-${this.props.stage}`, this, {
      ...this.props.testLoadTest,
      resourceGroupName: testStackProps.resourceGroupName,
    })
  }
}

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    let name

    // Return different names based on resource type
    if (args.type === 'azure-native:loadtestservice:LoadTest') {
      name = args.inputs.loadTestName
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

describe('TestAzureLoadTestConstruct', () => {
  test('is initialised as expected', () => {
    expect(stack.construct.props).toHaveProperty('testAttribute')
    expect(stack.construct.props.testAttribute).toEqual('success')
  })
})

describe('TestAzureLoadTestConstruct', () => {
  test('synthesises as expected', () => {
    expect(stack).toBeDefined()
    expect(stack.construct).toBeDefined()
    expect(stack.construct.loadTest).toBeDefined()
  })
})

describe('TestAzureLoadTestConstruct', () => {
  test('provisions load test resource as expected', async () => {
    await outputToPromise(
      pulumi
        .all([
          stack.construct.loadTest.id,
          stack.construct.loadTest.urn,
          stack.construct.loadTest.name,
          stack.construct.loadTest.location,
          stack.construct.loadTest.tags,
        ])
        .apply(([id, urn, name, location, tags]) => {
          expect(id).toEqual('test-load-test-dev-lt-id')
          expect(urn).toEqual(
            'urn:pulumi:stack::project::construct:test-common-stack$azure-native:loadtestservice:LoadTest::test-load-test-dev-lt'
          )
          expect(name).toEqual('testlt-dev')
          expect(location).toEqual('eastus')
          expect(tags).toHaveProperty('environment', 'dev')
        })
    )
  })
})

/* --- Tests for default value fallback branches --- */

class TestMinimalLoadTestConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps
  loadTest: LoadTest

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    // LoadTest with explicit location - covers truthy branch of props.location ?? scope.props.location
    this.loadTest = this.loadTestManager.createLoadTest(`test-minimal-load-test-${this.props.stage}`, this, {
      loadTestName: 'minimallt',
      resourceGroupName: testStackProps.resourceGroupName,
      location: 'westus',
    })
  }
}

class TestMinimalLoadTestStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestMinimalLoadTestConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, testStackProps)
    this.construct = new TestMinimalLoadTestConstruct(props.name, this.props)
  }
}

const minimalLoadTestStack = new TestMinimalLoadTestStack('test-minimal-load-test-stack', testStackProps)

describe('TestAzureLoadTestConstruct - Default Values', () => {
  test('load test uses explicit location when provided', async () => {
    await outputToPromise(
      pulumi.all([minimalLoadTestStack.construct.loadTest.location]).apply(([location]) => {
        expect(location).toEqual('westus')
      })
    )
  })
})

describe('TestAzureLoadTestConstruct - Props Undefined Error Handling', () => {
  test('createLoadTest throws when props are undefined', () => {
    expect(() => {
      minimalLoadTestStack.construct.loadTestManager.createLoadTest(
        'test-lt-err',
        minimalLoadTestStack.construct,
        undefined as any
      )
    }).toThrow('Props undefined for test-lt-err')
  })
})
