import * as pulumi from '@pulumi/pulumi'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps } from '../../../lib/azure/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/azure/common/cdkConfig/dummy.json'],
  features: {},
  name: 'test-azure-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/azure/common/pulumiEnv',
  debug: true,
}

class TestAzureStack extends CommonAzureStack {
  declare props: TestAzureStackProps
  declare construct: TestAzureConstruct

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
    this.construct = new TestAzureConstruct(props.name, this.props)
  }
}

class TestAzureConstruct extends CommonAzureConstruct {
  declare props: TestAzureStackProps

  constructor(name: string, props: TestAzureStackProps) {
    super(name, props)
  }
}

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    return {
      id: `${args.name}-id`,
      state: { ...args.inputs },
    }
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs
  },
})

describe('TestAzureCommonStack - Context Loading', () => {
  test('loads extra contexts successfully', () => {
    const stack = new TestAzureStack('test-stack-context', testStackProps)
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })

  test('loads stage contexts successfully', () => {
    const stack = new TestAzureStack('test-stack-stage-context', testStackProps)
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })

  test('handles missing extra contexts gracefully when not provided', () => {
    const propsWithoutExtraContexts = {
      ...testStackProps,
      extraContexts: undefined,
      debug: true,
    }
    const stack = new TestAzureStack('test-stack-no-extra-context', propsWithoutExtraContexts)
    expect(stack.props).toBeDefined()
  })

  test('throws error when extra context file does not exist', () => {
    const propsWithInvalidContext = {
      ...testStackProps,
      extraContexts: ['src/test/azure/common/cdkConfig/nonexistent.json'],
    }
    expect(() => {
      new TestAzureStack('test-stack-invalid-context', propsWithInvalidContext)
    }).toThrow(/Extra context properties unavailable/)
  })

  test('handles missing stage context file gracefully', () => {
    const propsWithMissingStageContext = {
      ...testStackProps,
      stage: 'nonexistent',
      debug: true,
    }
    const stack = new TestAzureStack('test-stack-missing-stage', propsWithMissingStageContext)
    expect(stack.props).toBeDefined()
  })

  test('determineConstructProps includes all required properties', () => {
    const stack = new TestAzureStack('test-stack-props', testStackProps)
    expect(stack.props).toHaveProperty('domainName')
    expect(stack.props).toHaveProperty('stage')
    expect(stack.props).toHaveProperty('resourceGroupName')
    expect(stack.props).toHaveProperty('location')
    expect(stack.props).toHaveProperty('globalPrefix')
    expect(stack.props).toHaveProperty('resourcePrefix')
  })

  test('fullyQualifiedDomain returns correct domain without subdomain', () => {
    const stack = new TestAzureStack('test-stack-domain', testStackProps)
    expect(stack['fullyQualifiedDomain']()).toBe('gradientedge.io')
  })

  test('fullyQualifiedDomain returns correct domain with subdomain', () => {
    const propsWithSubdomain = {
      ...testStackProps,
      subDomain: 'test',
    }
    const stack = new TestAzureStack('test-stack-subdomain', propsWithSubdomain)
    expect(stack['fullyQualifiedDomain']()).toBe('test.gradientedge.io')
  })
})

describe('TestAzureCommonStack - Tag Transformation', () => {
  test.skip('registers tag transformation when defaultTags provided', () => {
    // Skipped: registerStackTransformation requires Pulumi stack initialization which cannot be properly tested in isolation
    const propsWithTags = {
      ...testStackProps,
      defaultTags: {
        Environment: 'dev',
        Application: 'test',
      },
    }
    const stack = new TestAzureStack('test-stack-tags', propsWithTags)
    expect(stack.props.defaultTags).toBeDefined()
    expect(stack.props.defaultTags?.Environment).toBe('dev')
  })

  test('handles stack without defaultTags', () => {
    const propsWithoutTags = {
      ...testStackProps,
      defaultTags: undefined,
    }
    const stack = new TestAzureStack('test-stack-no-tags', propsWithoutTags)
    expect(stack.props).toBeDefined()
  })
})

describe('TestAzureCommonStack - Config', () => {
  test('initializes config successfully', () => {
    const stack = new TestAzureStack('test-stack-config', testStackProps)
    expect(stack.config).toBeDefined()
  })
})
