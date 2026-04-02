import * as pulumi from '@pulumi/pulumi'
import { vi } from 'vitest'
import { CommonCloudflareConstruct, CommonCloudflareStack, CommonCloudflareStackProps } from '../../src/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  testAttribute?: string
}

const testStackProps: any = {
  accountId: '123456789012',
  domainName: 'gradientedge.io',
  extraContexts: ['packages/cloudflare/test/common/config/dummy.json'],
  features: {},
  name: 'test-cloudflare-stack',
  skipStageForARecords: false,
  stage: 'dev',
  stageContextPath: 'packages/cloudflare/test/common/env',
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

pulumi.runtime.setAllConfig({
  'project:stage': testStackProps.stage,
  'project:stageContextPath': testStackProps.stageContextPath,
  'project:extraContexts': JSON.stringify(testStackProps.extraContexts),
  'project:debug': 'true',
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

  test('fullyQualifiedDomain returns correct domain with subdomain', () => {
    const stack = new TestCloudflareStack('test-stack-domain', testStackProps)
    expect(stack['fullyQualifiedDomain']()).toBe('dev.gradientedge.io')
  })

  test('fullyQualifiedDomain includes subDomain from stage context', () => {
    // The dev stage context sets subDomain to 'dev', so the FQDN includes it
    const stack = new TestCloudflareStack('test-stack-subdomain-ctx', testStackProps)
    expect(stack['fullyQualifiedDomain']()).toBe('dev.gradientedge.io')
    expect(stack.props.subDomain).toBe('dev')
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

  test('handles debug logs for non-dev stage with missing stage context', () => {
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const stack = new TestCloudflareStack('test-stack-nondev-debug', {
      ...testStackProps,
      stage: 'prd',
      debug: true,
    })
    expect(stack.props).toBeDefined()
    expect(consoleDebugSpy).toHaveBeenCalled()
    consoleDebugSpy.mockRestore()
  })

  test('does not log when debug is disabled and no extra contexts', () => {
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const stack = new TestCloudflareStack('test-stack-no-debug', {
      ...testStackProps,
      extraContexts: undefined,
      debug: false,
    })
    expect(stack.props).toBeDefined()
    consoleDebugSpy.mockRestore()
  })
})

describe('TestCloudflareCommonStack - Stage Contexts', () => {
  test('loads dev stage context file when present', () => {
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const stack = new TestCloudflareStack('test-stack-dev-stage', {
      ...testStackProps,
      stage: 'dev',
      debug: true,
    })
    expect(stack.props).toBeDefined()
    expect(stack.props.testAttribute).toEqual('success')
    consoleDebugSpy.mockRestore()
  })

  test('handles missing stage context for non-dev stage gracefully', () => {
    const consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    const stack = new TestCloudflareStack('test-stack-staging-no-ctx', {
      ...testStackProps,
      stage: 'staging',
      debug: true,
    })
    expect(stack.props).toBeDefined()
    consoleDebugSpy.mockRestore()
  })

  test('uses default stageContextPath when not provided', () => {
    const stack = new TestCloudflareStack('test-stack-default-ctx-path', {
      ...testStackProps,
      stageContextPath: undefined,
    })
    expect(stack.props).toBeDefined()
  })
})

class TestNoSubDomainStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps
  declare construct: TestCloudflareConstruct

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
    // Override subDomain to undefined after parent sets it from context
    const propsWithoutSubDomain = { ...this.props, subDomain: undefined }
    this.construct = new TestCloudflareConstruct(props.name, propsWithoutSubDomain)
  }
}

describe('TestCloudflareCommonStack - Construct without subDomain', () => {
  test('construct fullyQualifiedDomainName uses domainName when no subDomain', () => {
    const stack = new TestNoSubDomainStack('test-stack-no-sub', testStackProps)
    expect(stack.construct.fullyQualifiedDomainName).toBe('gradientedge.io')
  })
})
