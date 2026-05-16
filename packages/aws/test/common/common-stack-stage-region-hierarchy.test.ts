import * as cdk from 'aws-cdk-lib'
import { CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testLambda?: any
  logLevel?: string
  apiSubDomain?: string
}

describe('CommonStack - Stage-Region Context Hierarchy', () => {
  const regionProps = {
    domainName: 'gradientedge.io',
    extraContexts: ['packages/aws/test/common/cdk-config/base.json'],
    regionContextPath: 'packages/aws/test/common/cdk-region',
    stageRegionContextPath: 'packages/aws/test/common/cdk-env-region',
    name: 'test-stage-region',
    region: 'eu-west-1',
    stackName: 'test-stage-region',
    stage: 'tst',
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
        testLambda: this.node.tryGetContext('testLambda'),
        logLevel: this.node.tryGetContext('logLevel'),
        globalPrefix: this.node.tryGetContext('globalPrefix'),
        apiSubDomain: this.node.tryGetContext('apiSubDomain'),
      }
    }
  }

  const app = new cdk.App({ context: regionProps })
  const stack = new TestStack(app, 'test-stage-region-stack', regionProps)

  test('stage-region > stage > region > base: logLevel set in all layers, stage-region wins', () => {
    // base(base.json)='error', region(eu-west-1.json)='warn', stage(tst.json)='debug', stage-region(tst.eu-west-1.json)='trace'
    expect(stack.props.logLevel).toEqual('trace')
  })

  test('stage-region > stage > region: resourcePrefix overridden by stage-region', () => {
    // base='ge', region='ge-eu-west-1', stage='cdktest', stage-region='ge-test-eu-west-1'
    expect(stack.props.resourcePrefix).toEqual('ge-test-eu-west-1')
  })

  test('base only: globalPrefix set only in base, survives through all layers', () => {
    expect(stack.props.globalPrefix).toEqual('gradientedge')
  })

  test('stage > region but stage-region does not set subDomain: stage value survives', () => {
    // region='eu', stage='tst', stage-region does not set subDomain → stage wins
    expect(stack.props.subDomain).toEqual('tst')
  })

  test('stage-region overrides resource config: testLambda uses stage-region values', () => {
    // region(eu-west-1.json) has testLambda with memorySize=512
    // stage-region(tst.eu-west-1.json) overrides testLambda with memorySize=256
    expect(stack.props.testLambda.memorySize).toEqual(256)
    expect(stack.props.testLambda.timeoutInSecs).toEqual(10)
    expect(stack.props.testLambda.logRetentionInDays).toEqual(1)
  })
})

describe('CommonStack - Stage-Region Context - Graceful Handling', () => {
  test('missing stage-region file is silently skipped', () => {
    const noStageRegionProps = {
      domainName: 'gradientedge.io',
      extraContexts: ['packages/aws/test/common/cdk-config/base.json'],
      regionContextPath: 'packages/aws/test/common/cdk-region',
      stageRegionContextPath: 'packages/aws/test/common/cdk-env-region',
      name: 'test-no-stage-region',
      region: 'eu-west-1',
      stackName: 'test-no-stage-region',
      stage: 'prd',
      stageContextPath: 'packages/aws/test/common/cdk-env',
    }

    class TestStack extends CommonStack {
      declare props: TestStackProps

      constructor(parent: cdk.App, name: string, props: any) {
        super(parent, name, noStageRegionProps)
      }

      protected determineConstructProps(props: cdk.StackProps) {
        return {
          ...super.determineConstructProps(props),
          logLevel: this.node.tryGetContext('logLevel'),
        }
      }
    }

    const app = new cdk.App({ context: noStageRegionProps })
    const stack = new TestStack(app, 'test-no-stage-region-stack', noStageRegionProps)

    // no prd.eu-west-1.json → stage-region skipped, no prd.json → stage skipped
    // region(eu-west-1.json) logLevel='warn' survives
    expect(stack.props.logLevel).toEqual('warn')
  })
})
