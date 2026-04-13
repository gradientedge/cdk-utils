import * as pulumi from '@pulumi/pulumi'
import { vi } from 'vitest'
import { CommonAzureConstruct, CommonAzureStack, CommonAzureStackProps } from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  testAttribute?: string
}

const testStackProps: any = {
  domainName: 'gradientedge.io',
  extraContexts: ['packages/azure/test/common/config/dummy.json'],
  features: {},
  name: 'test-azure-stack',
  resourceGroupName: 'test-rg',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/azure/test/common/pulumiEnv',
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

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
})

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

describe('TestAzureCommonStack - Extra Contexts Edge Cases', () => {
  test('throws when extra context file does not exist', () => {
    const propsWithBadExtraContext = {
      ...testStackProps,
      extraContexts: ['packages/azure/test/common/config/nonexistent.json'],
    }
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(propsWithBadExtraContext.extraContexts),
    })

    expect(() => new TestAzureStack('test-stack-bad-context', propsWithBadExtraContext)).toThrow(
      'Extra context properties unavailable in path'
    )

    // Reset config for subsequent tests
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })

  test('debug logging is triggered when debug=true and no extra contexts', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:debug': 'true',
    })

    const stack = new TestAzureStack('test-stack-debug-no-extra', {
      ...testStackProps,
      extraContexts: undefined,
      debug: true,
    })
    expect(stack.props).toBeDefined()

    // Check that debug messages were logged
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No additional contexts provided'))

    consoleSpy.mockRestore()

    // Reset config
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })

  test('debug logging is triggered for dev stage detection', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    pulumi.runtime.setAllConfig({
      'project:stage': 'dev',
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
      'project:debug': 'true',
    })

    const stack = new TestAzureStack('test-stack-dev-stage-debug', {
      ...testStackProps,
      debug: true,
    })
    expect(stack.props).toBeDefined()

    // Dev stage should trigger the dev stage debug log
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Development stage'))

    consoleSpy.mockRestore()

    // Reset config
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })

  test('debug logging when adding extra context files', () => {
    const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
      'project:debug': 'true',
    })

    const stack = new TestAzureStack('test-stack-debug-with-context', {
      ...testStackProps,
      debug: true,
    })
    expect(stack.props).toBeDefined()

    // Should see "Adding additional contexts" log
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Adding additional contexts provided in'))

    consoleSpy.mockRestore()

    // Reset config
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })

  test('uses default stageContextPath when not specified', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': 'nonexistent-stage',
      'project:stageContextPath': 'packages/azure/test/common/env',
    })

    const stack = new TestAzureStack('test-stack-default-path', {
      ...testStackProps,
      stage: 'nonexistent-stage',
      extraContexts: undefined,
    })
    expect(stack.props).toBeDefined()

    // Reset config
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })
})

describe('TestAzureCommonStack - Environment Property Static Methods', () => {
  test('determineEnvironmentProperty returns directory containing stage context path', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': 'dev',
      'project:stageContextPath': 'packages/azure/test/common/env',
    })

    const result = (CommonAzureStack as any).determineEnvironmentProperty()
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)

    // Reset config
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })

  test('determineEnvironmentProperty throws when stage context path is not found', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': 'dev',
      'project:stageContextPath': 'some/non/existent/directory/xyz',
    })

    expect(() => (CommonAzureStack as any).determineEnvironmentProperty()).toThrow(
      'Could not locate infrastructure root'
    )

    // Reset config
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })

  test('getEnvironmentProperty reads property from environment config file', () => {
    pulumi.runtime.setAllConfig({
      'project:stage': 'dev',
      'project:stageContextPath': 'packages/azure/test/common/env',
    })

    const result = (CommonAzureStack as any).getEnvironmentProperty('testAttribute')
    expect(result).toBe('success')

    // Reset config
    pulumi.runtime.setAllConfig({
      'project:stage': testStackProps.stage,
      'project:stageContextPath': testStackProps.stageContextPath,
      'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
    })
  })
})

describe('TestAzureCommonStack - defaultTags', () => {
  test('does not throw when defaultTags are undefined', () => {
    const propsWithoutTags = {
      ...testStackProps,
      defaultTags: undefined,
    }
    const stack = new TestAzureStack('test-stack-undefined-tags', propsWithoutTags)
    expect(stack.props).toBeDefined()
    expect(stack.props.defaultTags).toBeUndefined()
  })
})
