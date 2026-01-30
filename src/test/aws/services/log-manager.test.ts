import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

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

describe('TestLogManager - Error Handling', () => {
  test('throws error when creating metric filter without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-1', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)
    const testLogGroup = testConstruct.logManager.createLogGroup('test-log-group', testConstruct, {
      logGroupName: 'test-log',
      retention: 7,
    })

    expect(() => {
      testConstruct.logManager.createMetricFilter(
        'test-metric-filter-no-props',
        testConstruct,
        null as any,
        testLogGroup
      )
    }).toThrow('MetricFilter props undefined for test-metric-filter-no-props')
  })

  test('throws error when creating cfn log group without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-2', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.logManager.createCfnLogGroup('test-cfn-log-no-props', testConstruct, null as any)
    }).toThrow('Logs props undefined for test-cfn-log-no-props')
  })

  test('throws error when creating cfn log group without logGroupName', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-3', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.logManager.createCfnLogGroup('test-cfn-log-no-name', testConstruct, {} as any)
    }).toThrow('Logs logGroupName undefined for test-cfn-log-no-name')
  })

  test('throws error when creating log group without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-4', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.logManager.createLogGroup('test-log-no-props', testConstruct, null as any)
    }).toThrow('Logs props undefined for test-log-no-props')
  })

  test('throws error when creating log group without logGroupName', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-5', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.logManager.createLogGroup('test-log-no-name', testConstruct, {} as any)
    }).toThrow('Logs logGroupName undefined for test-log-no-name')
  })

  test('creates metric filter with options', () => {
    const testStack = new TestCommonStack(app, 'test-options-stack', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)
    const testLogGroup = testConstruct.logManager.createLogGroup('test-log-group-2', testConstruct, {
      logGroupName: 'test-log-2',
      retention: 7,
    })

    const result = testConstruct.logManager.createMetricFilter(
      'test-metric-filter-with-options',
      testConstruct,
      {
        filterPattern: { logPatternString: 'ERROR' },
        logGroup: testLogGroup,
        metricName: 'ErrorCount',
        metricNamespace: 'MyApp',
        metricValue: '1',
        defaultValue: 0,
        periodInSecs: 60,
        options: {
          dimensionsMap: { Environment: 'test' },
          statistic: 'Sum',
        },
      } as any,
      testLogGroup
    )

    expect(result.metric).toBeDefined()
    expect(result.metricFilter).toBeDefined()
  })

  test('creates metric filter without options', () => {
    const testStack = new TestCommonStack(app, 'test-no-options-stack', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)
    const testLogGroup = testConstruct.logManager.createLogGroup('test-log-group-3', testConstruct, {
      logGroupName: 'test-log-3',
      retention: 7,
    })

    const result = testConstruct.logManager.createMetricFilter(
      'test-metric-filter-no-options',
      testConstruct,
      {
        filterPattern: { logPatternString: 'ERROR' },
        logGroup: testLogGroup,
        metricName: 'ErrorCount',
        metricNamespace: 'MyApp',
        metricValue: '1',
        defaultValue: 0,
        periodInSecs: 60,
        options: {},
      } as any,
      testLogGroup
    )

    expect(result.metric).toBeDefined()
    expect(result.metricFilter).toBeDefined()
  })

  test('creates cfn log group with tags', () => {
    const testStack = new TestCommonStack(app, 'test-tags-stack', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    const logGroup = testConstruct.logManager.createCfnLogGroup('test-cfn-log-with-tags', testConstruct, {
      logGroupName: 'test-log-with-tags',
      retention: 7,
      tags: [
        { key: 'Environment', value: 'test' },
        { key: 'Application', value: 'TestApp' },
      ],
    })

    expect(logGroup).toBeDefined()
  })

  test('creates log group with tags', () => {
    const testStack = new TestCommonStack(app, 'test-tags-stack-2', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    const logGroup = testConstruct.logManager.createLogGroup('test-log-with-tags', testConstruct, {
      logGroupName: 'test-log-with-tags',
      retention: 7,
      tags: [
        { key: 'Environment', value: 'test' },
        { key: 'Application', value: 'TestApp' },
      ],
    })

    expect(logGroup).toBeDefined()
  })

  test('creates log group with default removal policy', () => {
    const testStack = new TestCommonStack(app, 'test-removal-policy-stack', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    const logGroup = testConstruct.logManager.createLogGroup('test-log-default-removal', testConstruct, {
      logGroupName: 'test-log-default-removal',
      retention: 7,
    })

    expect(logGroup).toBeDefined()
  })
})
