import * as cdk from 'aws-cdk-lib'
import { CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  serverConfig?: any
  logLevel?: string
}

describe('CommonStack - Deep Merge - Extra Contexts', () => {
  const props = {
    domainName: 'gradientedge.io',
    extraContexts: [
      'packages/aws/test/common/cdk-config/deep-merge-base.json',
      'packages/aws/test/common/cdk-config/deep-merge-overlay.json',
    ],
    name: 'test-deep-merge-extra',
    region: 'eu-west-1',
    stackName: 'test-deep-merge-extra',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdk-env',
  }

  class TestStack extends CommonStack {
    declare props: TestStackProps

    constructor(parent: cdk.App, name: string, stackProps: any) {
      super(parent, name, props)
    }

    protected determineConstructProps(stackProps: cdk.StackProps) {
      return {
        ...super.determineConstructProps(stackProps),
        serverConfig: this.node.tryGetContext('serverConfig'),
        logLevel: this.node.tryGetContext('logLevel'),
      }
    }
  }

  const app = new cdk.App({ context: props })
  const stack = new TestStack(app, 'test-deep-merge-extra-stack', props)

  test('overlay overrides nested logging.level from base', () => {
    // base='error', overlay='warn', stage(test.json) has no serverConfig → overlay wins
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

describe('CommonStack - Deep Merge - Region Context', () => {
  const props = {
    domainName: 'gradientedge.io',
    extraContexts: [
      'packages/aws/test/common/cdk-config/deep-merge-base.json',
      'packages/aws/test/common/cdk-config/deep-merge-overlay.json',
    ],
    regionContextPath: 'packages/aws/test/common/cdk-region',
    name: 'test-deep-merge-region',
    region: 'deep-merge-eu-west-1',
    stackName: 'test-deep-merge-region',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdk-env',
  }

  class TestStack extends CommonStack {
    declare props: TestStackProps

    constructor(parent: cdk.App, name: string, stackProps: any) {
      super(parent, name, props)
    }

    protected determineConstructProps(stackProps: cdk.StackProps) {
      return {
        ...super.determineConstructProps(stackProps),
        serverConfig: this.node.tryGetContext('serverConfig'),
        logLevel: this.node.tryGetContext('logLevel'),
      }
    }
  }

  const app = new cdk.App({ context: props })
  const stack = new TestStack(app, 'test-deep-merge-region-stack', props)

  test('region overrides logging.level', () => {
    // base='error', overlay='warn', region='info', stage(test.json) has no serverConfig → region wins
    expect(stack.props.serverConfig.logging.level).toEqual('info')
  })

  test('region overrides logging.destination', () => {
    expect(stack.props.serverConfig.logging.destination).toEqual('cloudwatch')
  })

  test('base logging.format survives through region (not set in region)', () => {
    expect(stack.props.serverConfig.logging.format).toEqual('json')
  })

  test('region overrides cache.ttl, base cache.enabled and cache.maxSize survive', () => {
    expect(stack.props.serverConfig.cache.ttl).toEqual(600)
    expect(stack.props.serverConfig.cache.enabled).toEqual(true)
    expect(stack.props.serverConfig.cache.maxSize).toEqual(1000)
  })

  test('region adds serverConfig.region, base monitoring survives', () => {
    expect(stack.props.serverConfig.region).toEqual('eu-west-1')
    expect(stack.props.serverConfig.monitoring.enabled).toEqual(true)
    expect(stack.props.serverConfig.monitoring.endpoint).toEqual('https://monitor.example.com')
  })
})

describe('CommonStack - Deep Merge - Full Hierarchy', () => {
  const props = {
    domainName: 'gradientedge.io',
    extraContexts: [
      'packages/aws/test/common/cdk-config/deep-merge-base.json',
      'packages/aws/test/common/cdk-config/deep-merge-overlay.json',
    ],
    regionContextPath: 'packages/aws/test/common/cdk-region',
    stageRegionContextPath: 'packages/aws/test/common/cdk-env-region',
    name: 'test-deep-merge-full',
    region: 'deep-merge-eu-west-1',
    stackName: 'test-deep-merge-full',
    stage: 'deep-merge-tst',
    stageContextPath: 'packages/aws/test/common/cdk-env',
  }

  class TestStack extends CommonStack {
    declare props: TestStackProps

    constructor(parent: cdk.App, name: string, stackProps: any) {
      super(parent, name, props)
    }

    protected determineConstructProps(stackProps: cdk.StackProps) {
      return {
        ...super.determineConstructProps(stackProps),
        serverConfig: this.node.tryGetContext('serverConfig'),
        logLevel: this.node.tryGetContext('logLevel'),
      }
    }
  }

  const app = new cdk.App({ context: props })
  const stack = new TestStack(app, 'test-deep-merge-full-stack', props)

  test('stage-region wins for logging.level (set in all 5 layers)', () => {
    // base='error', overlay='warn', region='info', stage='debug', stage-region='trace'
    expect(stack.props.serverConfig.logging.level).toEqual('trace')
  })

  test('base logging.format survives through all layers (only set in base)', () => {
    expect(stack.props.serverConfig.logging.format).toEqual('json')
  })

  test('region logging.destination survives through stage and stage-region', () => {
    // base='stdout', region='cloudwatch', not set in stage or stage-region
    expect(stack.props.serverConfig.logging.destination).toEqual('cloudwatch')
  })

  test('stage overrides cache.maxSize, region overrides cache.ttl, base cache.enabled survives', () => {
    // base: enabled=true, ttl=300, maxSize=1000
    // region: ttl=600
    // stage: maxSize=2000
    expect(stack.props.serverConfig.cache.enabled).toEqual(true)
    expect(stack.props.serverConfig.cache.ttl).toEqual(600)
    expect(stack.props.serverConfig.cache.maxSize).toEqual(2000)
  })

  test('overlay monitoring.enabled survives through all higher layers', () => {
    // base: enabled=false, overlay: enabled=true, not set in region/stage/stage-region
    expect(stack.props.serverConfig.monitoring.enabled).toEqual(true)
  })

  test('base monitoring.endpoint survives through all layers', () => {
    expect(stack.props.serverConfig.monitoring.endpoint).toEqual('https://monitor.example.com')
  })

  test('region serverConfig.region survives through stage and stage-region', () => {
    expect(stack.props.serverConfig.region).toEqual('eu-west-1')
  })

  test('primitive props follow highest-priority-wins: stage-region logLevel wins', () => {
    expect(stack.props.logLevel).toEqual('trace')
  })

  test('primitive props from intermediate layers survive when not overridden', () => {
    // subDomain set only in stage, not overridden by stage-region
    expect(stack.props.subDomain).toEqual('tst')
  })

  test('base globalPrefix survives all layers', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })
})
