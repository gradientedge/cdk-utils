import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Template } from 'aws-cdk-lib/assertions'
import { CommonStackProps } from '../../lib/types'
import { CommonConstruct } from '../../lib/common/commonConstruct'
import { CommonStack } from '../../lib/common/commonStack'

interface TestStackProps extends CommonStackProps {
  testLogGroup: any
  testAnotherLogGroup: any
  testMetricFilter: any
}

const testStackProps = {
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  name: 'test-common-stack',
  domainName: 'gradientedge.io',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  extraContexts: ['src/test/common/cdkConfig/logs.json'],
  stageContextPath: 'src/test/common/cdkEnv',
}

class TestCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testMetricFilter: this.node.tryGetContext('testMetricFilter'),
      },
    }
  }
}

class TestInvalidCommonStack extends CommonStack {
  declare props: TestStackProps

  constructor(parent: cdk.App, name: string, props: cdk.StackProps) {
    super(parent, name, props)

    this.construct = new TestCommonConstruct(this, testStackProps.name, this.props)
  }

  protected determineConstructProps(props: cdk.StackProps) {
    return {
      ...super.determineConstructProps(props),
      ...{
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    this.logManager.createCfnLogGroup('test-cfn-log', this, this.props.testLogGroup)
    const testLogGroup = this.logManager.createLogGroup('test-log', this, this.props.testAnotherLogGroup)
    this.logManager.createMetricFilter('test-metric-filter', this, this.props.testMetricFilter, testLogGroup)
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestEksConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('MetricFilter props undefined')
  })
})

describe('TestEksConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Logs::LogGroup', 2)
    template.resourceCountIs('AWS::Logs::MetricFilter', 1)
  })
})

describe('TestEksConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testCfnLogLogGroupArn', {})
    template.hasOutput('testLogLogGroupArn', {})
  })
})

describe('TestEksConstruct', () => {
  test('provisions new cluster as expected', () => {
    template.hasResourceProperties('AWS::Logs::MetricFilter', {
      FilterPattern: 'Failure during execution',
      MetricTransformations: [
        {
          DefaultValue: 0,
          MetricName: 'test-filter',
          MetricNamespace: 'test',
          MetricValue: '1',
        },
      ],
    })
  })
})
