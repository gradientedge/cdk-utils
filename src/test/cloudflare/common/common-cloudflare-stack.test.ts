import * as pulumi from '@pulumi/pulumi'
import { vi } from 'vitest'
import {
  CommonCloudflareConstruct,
  CommonCloudflareStack,
  CommonCloudflareStackProps,
} from '../../../lib/cloudflare/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: ['src/test/cloudflare/common/config/dummy.json'],
  features: {},
  name: 'test-cloudflare-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'src/test/cloudflare/common/env',
  debug: true,
}

class TestCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestCloudflareConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    this.construct = new TestCloudflareConstruct(props.name, this.props)
  }
}

class TestCloudflareConstruct extends CommonCloudflareConstruct {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
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

describe('TestCloudflareCommonStack - Context Loading', () => {
  test('loads extra contexts successfully', () => {
    const stack = new TestCloudflareStack('test-stack-context', testStackProps)
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })

  test('loads stage contexts successfully', () => {
    const stack = new TestCloudflareStack('test-stack-stage-context', testStackProps)
    expect(stack.props).toHaveProperty('testAttribute')
    expect(stack.props.testAttribute).toEqual('success')
  })

  test('handles missing extra contexts gracefully when not provided', () => {
    const propsWithoutExtraContexts = {
      ...testStackProps,
      extraContexts: undefined,
      debug: true,
    }
    const stack = new TestCloudflareStack('test-stack-no-extra-context', propsWithoutExtraContexts)
    expect(stack.props).toBeDefined()
  })

  test('throws error when extra context file does not exist', () => {
    const propsWithInvalidContext = {
      ...testStackProps,
      extraContexts: ['src/test/cloudflare/common/config/nonexistent.json'],
    }
    expect(() => {
      new TestCloudflareStack('test-stack-invalid-context', propsWithInvalidContext)
    }).toThrow(/Extra context properties unavailable/)
  })

  test('handles missing stage context file gracefully', () => {
    const propsWithMissingStageContext = {
      ...testStackProps,
      stage: 'nonexistent',
      debug: true,
    }
    const stack = new TestCloudflareStack('test-stack-missing-stage', propsWithMissingStageContext)
    expect(stack.props).toBeDefined()
  })

  test('determineConstructProps includes all required properties', () => {
    const stack = new TestCloudflareStack('test-stack-props', testStackProps)
    expect(stack.props).toHaveProperty('domainName')
    expect(stack.props).toHaveProperty('stage')
    expect(stack.props).toHaveProperty('accountId')
    expect(stack.props).toHaveProperty('name')
  })

  test('fullyQualifiedDomain returns correct domain without subdomain', () => {
    // Note: The dev stage context file sets subDomain, so we use a stage without context to test
    const propsWithoutSubdomain = {
      ...testStackProps,
      stage: 'nonexistent',
    }
    const stack = new TestCloudflareStack('test-stack-domain', propsWithoutSubdomain)
    expect(stack['fullyQualifiedDomain']()).toBe('gradientedge.io')
  })

  test('fullyQualifiedDomain returns correct domain with subdomain', () => {
    // Note: The dev stage context sets subDomain: 'dev', so we use a different stage
    const propsWithSubdomain = {
      ...testStackProps,
      stage: 'nonexistent',
      subDomain: 'test',
    }
    const stack = new TestCloudflareStack('test-stack-subdomain', propsWithSubdomain)
    expect(stack['fullyQualifiedDomain']()).toBe('test.gradientedge.io')
  })
})

describe('TestCloudflareCommonStack - Config', () => {
  test('initializes config successfully', () => {
    const stack = new TestCloudflareStack('test-stack-config', testStackProps)
    expect(stack.config).toBeDefined()
  })
})

describe('TestCloudflareCommonStack - Debug Mode', () => {
  test('handles debug logs when loading contexts with debug enabled', () => {
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const stack = new TestCloudflareStack('test-stack-debug', {
      ...testStackProps,
      debug: true,
    })
    expect(stack.props).toBeDefined()
    consoleDebugSpy.mockRestore()
  })

  test('handles debug logs for dev stage', () => {
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const stack = new TestCloudflareStack('test-stack-dev-debug', {
      ...testStackProps,
      stage: 'dev',
      debug: true,
    })
    expect(stack.props).toBeDefined()
    consoleDebugSpy.mockRestore()
  })
})
