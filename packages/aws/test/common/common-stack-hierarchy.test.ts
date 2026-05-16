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
    extraContexts: ['packages/aws/test/common/cdk-config/base.json'],
    regionContextPath: 'packages/aws/test/common/cdk-region',
    name: 'test-region-euw1',
    region: 'eu-west-1',
    stackName: 'test-region-euw1',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdk-env',
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
    extraContexts: ['packages/aws/test/common/cdk-config/base.json'],
    regionContextPath: 'packages/aws/test/common/cdk-region',
    name: 'test-region-use1',
    region: 'us-east-1',
    stackName: 'test-region-use1',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdk-env',
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

describe('CommonStack - Region Context Hierarchy - Auto-Select from Multiple Regions', () => {
  const regionProps = {
    domainName: 'gradientedge.io',
    extraContexts: ['packages/aws/test/common/cdk-config/base.json'],
    regionContextPath: 'packages/aws/test/common/cdk-region',
    name: 'test-region-multi',
    region: 'us-east-1',
    stackName: 'test-region-multi',
    stage: 'test',
    stageContextPath: 'packages/aws/test/common/cdk-env',
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

  test('only the matching region file is applied when multiple are configured', () => {
    // region is 'us-east-1', so eu-west-1.json is skipped and us-east-1.json is applied
    // resourcePrefix: base='ge', region-us='ge-us-east-1', stage='cdktest' → stage wins
    expect(stack.props.resourcePrefix).toEqual('cdktest')
    // subDomain: region-us='us', stage='test' → stage wins
    expect(stack.props.subDomain).toEqual('test')
    // logLevel: base='error', region-us='info', stage='debug' → stage wins
    expect(stack.props.logLevel).toEqual('debug')
    // apiSubDomain: region-us='api-us', stage='api' → stage wins
    expect(stack.props.apiSubDomain).toEqual('api')
  })
})

describe('CommonStack - Region Context Hierarchy - Graceful Handling', () => {
  test('handles missing region context file gracefully', () => {
    const missingRegionProps = {
      domainName: 'gradientedge.io',
      extraContexts: ['packages/aws/test/common/cdk-config/base.json'],
      regionContextPath: 'packages/aws/test/common/cdk-region',
      name: 'test-missing-region',
      region: 'ap-southeast-1',
      stackName: 'test-missing-region',
      stage: 'test',
      stageContextPath: 'packages/aws/test/common/cdk-env',
    }

    class TestStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, missingRegionProps)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          globalPrefix: this.node.tryGetContext('globalPrefix'),
          logLevel: this.node.tryGetContext('logLevel'),
        }
      }
    }

    const app = new cdk.App({ context: missingRegionProps })
    const stack = new TestStack(app, 'test-missing-region-stack', missingRegionProps)

    // no ap-southeast-1.json exists, so region layer is skipped
    // base='error', stage='debug' → stage wins
    expect(stack.props.logLevel).toEqual('debug')
    expect(stack.props.globalPrefix).toEqual('gradientedge')
    expect(stack.props.stage).toEqual('test')
  })

  test('no regionContextPath leaves props unaffected by region layer', () => {
    const noRegionProps = {
      domainName: 'gradientedge.io',
      extraContexts: ['packages/aws/test/common/cdk-config/base.json'],
      name: 'test-no-region',
      region: 'eu-west-1',
      stackName: 'test-no-region',
      stage: 'test',
      stageContextPath: 'packages/aws/test/common/cdk-env',
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
