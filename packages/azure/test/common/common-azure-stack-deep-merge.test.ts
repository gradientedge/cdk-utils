import * as pulumi from '@pulumi/pulumi'
import { CommonAzureStack, CommonAzureStackProps } from '../../src/index.js'

interface TestAzureStackProps extends CommonAzureStackProps {
  serverConfig?: any
  logLevel?: string
}

class TestAzureStack extends CommonAzureStack {
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

const baseContexts = [
  'packages/azure/test/common/config/deep-merge-base.json',
  'packages/azure/test/common/config/deep-merge-overlay.json',
]

describe('CommonAzureStack - Deep Merge - Extra Contexts', () => {
  pulumi.runtime.setAllConfig({
    'project:stage': 'nonexistent',
    'project:stageContextPath': 'packages/azure/test/common/env',
    'project:extraContexts': JSON.stringify(baseContexts),
  })

  const stack = new TestAzureStack('test-dm-extra', {
    domainName: 'gradientedge.io',
    name: 'test-dm-extra',
    resourceGroupName: 'test-rg',
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

describe('CommonAzureStack - Deep Merge - Region Context', () => {
  pulumi.runtime.setAllConfig({
    'project:stage': 'nonexistent',
    'project:stageContextPath': 'packages/azure/test/common/env',
    'project:extraContexts': JSON.stringify(baseContexts),
    'project:location': 'deep-merge-uksouth',
    'project:regionContextPath': 'packages/azure/test/common/region',
  })

  const stack = new TestAzureStack('test-dm-region', {
    domainName: 'gradientedge.io',
    name: 'test-dm-region',
    resourceGroupName: 'test-rg',
    extraContexts: baseContexts,
  } as any)

  test('region overrides logging.destination from base', () => {
    expect(stack.props.serverConfig.logging.destination).toEqual('azure-monitor')
  })

  test('base logging.format survives through region (not set in region)', () => {
    expect(stack.props.serverConfig.logging.format).toEqual('json')
  })

  test('region overrides cache.ttl, base cache.enabled and cache.maxSize survive', () => {
    expect(stack.props.serverConfig.cache.ttl).toEqual(600)
    expect(stack.props.serverConfig.cache.enabled).toEqual(true)
    expect(stack.props.serverConfig.cache.maxSize).toEqual(1000)
  })

  test('region adds serverConfig.region, monitoring from overlay survives', () => {
    expect(stack.props.serverConfig.region).toEqual('uksouth')
    expect(stack.props.serverConfig.monitoring.enabled).toEqual(true)
    expect(stack.props.serverConfig.monitoring.endpoint).toEqual('https://monitor.example.com')
  })
})

describe('CommonAzureStack - Deep Merge - Full Hierarchy', () => {
  pulumi.runtime.setAllConfig({
    'project:stage': 'deep-merge-tst',
    'project:stageContextPath': 'packages/azure/test/common/env',
    'project:extraContexts': JSON.stringify(baseContexts),
    'project:location': 'deep-merge-uksouth',
    'project:regionContextPath': 'packages/azure/test/common/region',
    'project:stageRegionContextPath': 'packages/azure/test/common/env-region',
  })

  const stack = new TestAzureStack('test-dm-full', {
    domainName: 'gradientedge.io',
    name: 'test-dm-full',
    resourceGroupName: 'test-rg',
    extraContexts: baseContexts,
  } as any)

  test('stage-region wins for logging.level (set in all 5 layers)', () => {
    // base='error', overlay='warn', region='info', stage='debug', stage-region='trace'
    expect(stack.props.serverConfig.logging.level).toEqual('trace')
  })

  test('base logging.format survives through all layers (only set in base)', () => {
    expect(stack.props.serverConfig.logging.format).toEqual('json')
  })

  test('region logging.destination survives through stage and stage-region', () => {
    // base='stdout', region='azure-monitor', not set in stage or stage-region
    expect(stack.props.serverConfig.logging.destination).toEqual('azure-monitor')
  })

  test('stage overrides cache.maxSize, region overrides cache.ttl, base cache.enabled survives', () => {
    expect(stack.props.serverConfig.cache.enabled).toEqual(true)
    expect(stack.props.serverConfig.cache.ttl).toEqual(600)
    expect(stack.props.serverConfig.cache.maxSize).toEqual(2000)
  })

  test('overlay monitoring.enabled survives through all higher layers', () => {
    expect(stack.props.serverConfig.monitoring.enabled).toEqual(true)
  })

  test('base monitoring.endpoint survives through all layers', () => {
    expect(stack.props.serverConfig.monitoring.endpoint).toEqual('https://monitor.example.com')
  })

  test('region serverConfig.region survives through stage and stage-region', () => {
    expect(stack.props.serverConfig.region).toEqual('uksouth')
  })

  test('primitive props follow highest-priority-wins: stage-region logLevel wins', () => {
    expect(stack.props.logLevel).toEqual('trace')
  })

  test('primitive props from intermediate layers survive when not overridden', () => {
    expect(stack.props.subDomain).toEqual('tst')
  })

  test('base globalPrefix survives all layers', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })
})
