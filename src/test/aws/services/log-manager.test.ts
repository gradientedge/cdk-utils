import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testAnotherLogGroup: any
  testLogGroup: any
  testMetricFilter: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/logs.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'src/test/aws/common/cdkEnv',
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
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
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
        testAnotherLogGroup: this.node.tryGetContext('testAnotherLogGroup'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
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
