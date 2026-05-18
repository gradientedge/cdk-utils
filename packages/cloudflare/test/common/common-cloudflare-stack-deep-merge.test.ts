import * as pulumi from '@pulumi/pulumi'
import { CommonCloudflareStack, CommonCloudflareStackProps } from '../../src/index.js'

interface TestCloudflareStackProps extends CommonCloudflareStackProps {
  serverConfig?: any
  logLevel?: string
  globalPrefix?: string
}

class TestCloudflareStack extends CommonCloudflareStack {
  declare props: TestCloudflareStackProps

  constructor(name: string, props: TestCloudflareStackProps) {
    super(name, props)
  }
}

const baseContexts = [
  'packages/cloudflare/test/common/config/deep-merge-base.json',
  'packages/cloudflare/test/common/config/deep-merge-overlay.json',
]

pulumi.runtime.setAllConfig({
  'project:stage': 'nonexistent',
  'project:stageContextPath': 'packages/cloudflare/test/common/env',
  'project:extraContexts': JSON.stringify(baseContexts),
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

describe('CommonCloudflareStack - Deep Merge - Extra Contexts', () => {
  const stack = new TestCloudflareStack('test-dm-extra', {
    accountId: '123456789012',
    domainName: 'gradientedge.io',
    name: 'test-dm-extra',
    extraContexts: baseContexts,
  } as any)

  test('overlay overrides nested logging.level from base', () => {
    expect(stack.props.serverConfig.logging.level).toEqual('warn')
  })

  test('base logging.format survives through overlay (not set in overlay)', () => {
    expect(stack.props.serverConfig.logging.format).toEqual('json')
  })

  test('base logging.destination survives through overlay (not set in overlay)', () => {
    expect(stack.props.serverConfig.logging.destination).toEqual('stdout')
  })

  test('base cache object survives entirely through overlay (not set in overlay)', () => {
    expect(stack.props.serverConfig.cache).toEqual({
      enabled: true,
      ttl: 300,
      maxSize: 1000,
    })
  })

  test('overlay overrides monitoring.enabled from base', () => {
    expect(stack.props.serverConfig.monitoring.enabled).toEqual(true)
  })

  test('base monitoring.endpoint survives through overlay (not set in overlay)', () => {
    expect(stack.props.serverConfig.monitoring.endpoint).toEqual('https://monitor.example.com')
  })
})

describe('CommonCloudflareStack - Deep Merge - Stage Context', () => {
  pulumi.runtime.setAllConfig({
    'project:stage': 'deep-merge-tst',
    'project:stageContextPath': 'packages/cloudflare/test/common/env',
    'project:extraContexts': JSON.stringify(baseContexts),
  })

  const stack = new TestCloudflareStack('test-dm-stage', {
    accountId: '123456789012',
    domainName: 'gradientedge.io',
    name: 'test-dm-stage',
    extraContexts: baseContexts,
  } as any)

  test('stage overrides logging.level (base=error, overlay=warn, stage=debug)', () => {
    expect(stack.props.serverConfig.logging.level).toEqual('debug')
  })

  test('base logging.format survives through overlay and stage (only set in base)', () => {
    expect(stack.props.serverConfig.logging.format).toEqual('json')
  })

  test('base logging.destination survives through overlay and stage', () => {
    expect(stack.props.serverConfig.logging.destination).toEqual('stdout')
  })

  test('stage overrides cache.maxSize, base cache.enabled and cache.ttl survive', () => {
    expect(stack.props.serverConfig.cache.enabled).toEqual(true)
    expect(stack.props.serverConfig.cache.ttl).toEqual(300)
    expect(stack.props.serverConfig.cache.maxSize).toEqual(2000)
  })

  test('overlay monitoring.enabled survives through stage', () => {
    expect(stack.props.serverConfig.monitoring.enabled).toEqual(true)
  })

  test('base monitoring.endpoint survives through overlay and stage', () => {
    expect(stack.props.serverConfig.monitoring.endpoint).toEqual('https://monitor.example.com')
  })

  test('primitive props from stage override lower layers', () => {
    expect(stack.props.logLevel).toEqual('debug')
    expect(stack.props.subDomain).toEqual('tst')
  })

  test('base globalPrefix survives through overlay and stage', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })
})
