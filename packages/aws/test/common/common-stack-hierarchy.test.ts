import * as cdk from 'aws-cdk-lib'
import { CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testAttribute?: string
  logLevel?: string
  apiSubDomain?: string
  subDomain?: string
}

describe('CommonStack - Region Context Hierarchy - eu-west-1', () => {
  const regionProps = {
    domainName: 'gradientedge.io',
    extraContexts: ['packages/aws/test/common/cdkConfig/base.json'],
    regionContexts: ['packages/aws/test/common/cdkRegion/eu-west-1.json'],
    name: 'test-region-euw1',
    region: 'eu-west-1',
    stackName: 'test-region-euw1',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdkEnv',
  }

  class TestStack extends CommonStack {
    declare props: TestStackProps

    constructor(parent: cdk.App, name: string, props: any) {
      super(parent, name, regionProps)
    }

    protected determineConstructProps(props: cdk.StackProps) {
      return {
        ...super.determineConstructProps(props),
        testAttribute: this.node.tryGetContext('testAttribute'),
        globalPrefix: this.node.tryGetContext('globalPrefix'),
        logLevel: this.node.tryGetContext('logLevel'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
      }
    }
  }

  const app = new cdk.App({ context: regionProps })
  const stack = new TestStack(app, 'test-region-euw1-stack', regionProps)

  test('stage > region > base: logLevel set in all 3 layers, stage wins', () => {
    // base(base.json)='error', region(eu-west-1.json)='warn', stage(test.json)='debug'
    expect(stack.props.logLevel).toEqual('debug')
  })

  test('stage > region > base: resourcePrefix set in all 3 layers, stage wins', () => {
    // base(base.json)='ge', region(eu-west-1.json)='ge-eu-west-1', stage(test.json)='cdktest'
    expect(stack.props.resourcePrefix).toEqual('cdktest')
  })

  test('base only: globalPrefix set only in base, survives through region and stage', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })

  test('stage > region: subDomain set in region and stage, stage wins', () => {
    // region(eu-west-1.json)='eu', stage(test.json)='test'
    expect(stack.props.subDomain).toEqual('test')
  })

  test('stage > region: apiSubDomain set in region and stage, stage wins', () => {
    // region(eu-west-1.json)='api-eu', stage(test.json)='api'
    expect(stack.props.apiSubDomain).toEqual('api')
  })
})

describe('CommonStack - Region Context Hierarchy - us-east-1', () => {
  const regionProps = {
    domainName: 'gradientedge.io',
    extraContexts: ['packages/aws/test/common/cdkConfig/base.json'],
    regionContexts: ['packages/aws/test/common/cdkRegion/us-east-1.json'],
    name: 'test-region-use1',
    region: 'us-east-1',
    stackName: 'test-region-use1',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdkEnv',
  }

  class TestStack extends CommonStack {
    declare props: TestStackProps

    constructor(parent: cdk.App, name: string, props: any) {
      super(parent, name, regionProps)
    }

    protected determineConstructProps(props: cdk.StackProps) {
      return {
        ...super.determineConstructProps(props),
        testAttribute: this.node.tryGetContext('testAttribute'),
        globalPrefix: this.node.tryGetContext('globalPrefix'),
        logLevel: this.node.tryGetContext('logLevel'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
      }
    }
  }

  const app = new cdk.App({ context: regionProps })
  const stack = new TestStack(app, 'test-region-use1-stack', regionProps)

  test('stage > region > base: logLevel set in all 3 layers, stage wins', () => {
    expect(stack.props.logLevel).toEqual('debug')
  })

  test('stage > region > base: resourcePrefix set in all 3 layers, stage wins', () => {
    expect(stack.props.resourcePrefix).toEqual('cdktest')
  })

  test('base only: globalPrefix set only in base, survives through region and stage', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })

  test('stage > region: subDomain set in region and stage, stage wins', () => {
    expect(stack.props.subDomain).toEqual('test')
  })

  test('stage > region: apiSubDomain set in region and stage, stage wins', () => {
    expect(stack.props.apiSubDomain).toEqual('api')
  })
})

describe('CommonStack - Region Context Hierarchy - Multiple Regions', () => {
  const regionProps = {
    domainName: 'gradientedge.io',
    extraContexts: ['packages/aws/test/common/cdkConfig/base.json'],
    regionContexts: [
      'packages/aws/test/common/cdkRegion/eu-west-1.json',
      'packages/aws/test/common/cdkRegion/us-east-1.json',
    ],
    name: 'test-region-multi',
    region: 'us-east-1',
    stackName: 'test-region-multi',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdkEnv',
  }

  class TestStack extends CommonStack {
    declare props: TestStackProps

    constructor(parent: cdk.App, name: string, props: any) {
      super(parent, name, regionProps)
    }

    protected determineConstructProps(props: cdk.StackProps) {
      return {
        ...super.determineConstructProps(props),
        logLevel: this.node.tryGetContext('logLevel'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
      }
    }
  }

  const app = new cdk.App({ context: regionProps })
  const stack = new TestStack(app, 'test-region-multi-stack', regionProps)

  test('later region file overrides earlier for shared keys, stage still wins', () => {
    // resourcePrefix: base='ge', region-eu='ge-eu-west-1', region-us='ge-us-east-1', stage='cdktest' → stage wins
    expect(stack.props.resourcePrefix).toEqual('cdktest')
    // subDomain: region-eu='eu', region-us='us', stage='test' → stage wins
    expect(stack.props.subDomain).toEqual('test')
    // logLevel: base='error', region-eu='warn', region-us='info', stage='debug' → stage wins
    expect(stack.props.logLevel).toEqual('debug')
  })
})

describe('CommonStack - Region Context Hierarchy - Error Handling', () => {
  test('throws error when region context file not found', () => {
    const errorProps = {
      domainName: 'gradientedge.io',
      regionContexts: ['packages/aws/test/common/cdkRegion/nonexistent.json'],
      name: 'test-region-error',
      region: 'eu-west-1',
      stackName: 'test-region-error',
      stage: 'test',
    }

    class TestStack extends CommonStack {
      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, errorProps)
      }
    }

    const app = new cdk.App({ context: errorProps })
    expect(() => new TestStack(app, 'test-region-error-stack', errorProps)).toThrow(
      'Region context properties unavailable'
    )
  })

  test('no region contexts leaves props unaffected by region layer', () => {
    const noRegionProps = {
      domainName: 'gradientedge.io',
      extraContexts: ['packages/aws/test/common/cdkConfig/base.json'],
      name: 'test-no-region',
      region: 'eu-west-1',
      stackName: 'test-no-region',
      stage: 'test',
      stageContextPath: 'packages/aws/test/common/cdkEnv',
    }

    class TestStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, noRegionProps)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          globalPrefix: this.node.tryGetContext('globalPrefix'),
          logLevel: this.node.tryGetContext('logLevel'),
        }
      }
    }

    const app = new cdk.App({ context: noRegionProps })
    const stack = new TestStack(app, 'test-no-region-stack', noRegionProps)

    expect(stack.props.logLevel).toEqual('debug')
    expect(stack.props.globalPrefix).toEqual('gradientedge')
    expect(stack.props.resourcePrefix).toEqual('cdktest')
    expect(stack.props.name).toEqual('test-no-region')
    expect(stack.props.stage).toEqual('test')
    expect(stack.props.subDomain).toEqual('test')
  })
})
