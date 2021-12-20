import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { Template } from 'aws-cdk-lib/assertions'
import { CommonStackProps } from '../../lib/types'
import { CommonConstruct } from '../../lib/common/commonConstruct'
import { CommonStack } from '../../lib/common/commonStack'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'

interface TestStackProps extends CommonStackProps {
  testLogGroup: any
  testMetric: any
  testAlarm: any
  testAnotherAlarm: any
  testAlarmStatusWidget: any
  testGraphWidget: any
  testLogQueryWidget: any
  testSingleValueWidget: any
  testTextWidget: any
  testWidget: any
  testWidgets: any
  testDashboard: any
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
  extraContexts: ['src/test/common/cdkConfig/dashboard.json', 'src/test/common/cdkConfig/logs.json'],
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
        testMetric: this.node.tryGetContext('testMetric'),
        testAlarm: this.node.tryGetContext('testAlarm'),
        testAnotherAlarm: this.node.tryGetContext('testAnotherAlarm'),
        testAlarmStatusWidget: this.node.tryGetContext('testAlarmStatusWidget'),
        testGraphWidget: this.node.tryGetContext('testGraphWidget'),
        testLogQueryWidget: this.node.tryGetContext('testLogQueryWidget'),
        testSingleValueWidget: this.node.tryGetContext('testSingleValueWidget'),
        testTextWidget: this.node.tryGetContext('testTextWidget'),
        testWidget: this.node.tryGetContext('testWidget'),
        testWidgets: this.node.tryGetContext('testWidgets'),
        testDashboard: this.node.tryGetContext('testDashboard'),
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
        testMetric: this.node.tryGetContext('testMetric'),
        testAlarm: this.node.tryGetContext('testAlarm'),
        testAnotherAlarm: this.node.tryGetContext('testAnotherAlarm'),
        testAlarmStatusWidget: this.node.tryGetContext('testAlarmStatusWidget'),
        testGraphWidget: this.node.tryGetContext('testGraphWidget'),
        testLogQueryWidget: this.node.tryGetContext('testLogQueryWidget'),
        testSingleValueWidget: this.node.tryGetContext('testSingleValueWidget'),
        testTextWidget: this.node.tryGetContext('testTextWidget'),
        testWidget: this.node.tryGetContext('testWidget'),
        testWidgets: this.node.tryGetContext('testWidgets'),
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)

    const testLogGroup = this.logManager.createLogGroup('test-log', this, this.props.testLogGroup)
    const testAlarm = this.cloudWatchManager.createAlarmForExpression('test-alarm', this, this.props.testAlarm)
    const testMetric = new watch.Metric(this.props.testMetric)
    const testAlarmMetric = this.cloudWatchManager.createAlarmForMetric(
      'test-alarm-metric',
      this,
      this.props.testAnotherAlarm,
      testMetric
    )
    const alarmStatusWidget = this.cloudWatchManager.createAlarmStatusWidget(
      'test-alarm-status-widget',
      this,
      this.props.testAlarmStatusWidget,
      [testAlarm, testAlarmMetric]
    )
    const graphWidget = this.cloudWatchManager.createGraphWidget('test-graph-widget', this, this.props.testGraphWidget)
    const logQueryWidget = this.cloudWatchManager.createLogQueryWidget(
      'test-log-query-widget',
      this,
      this.props.testLogQueryWidget,
      [testLogGroup.logGroupName]
    )
    const singleValueWidget = this.cloudWatchManager.createSingleValueWidget(
      'test-single-value-widget',
      this,
      this.props.testSingleValueWidget,
      [testMetric]
    )
    const textWidget = this.cloudWatchManager.createTextWidget('test-text-widget', this, this.props.testTextWidget)
    this.cloudWatchManager.createWidget('test-widget', this, this.props.testWidget)
    this.cloudWatchManager.createWidgets(this, this.props.testWidgets)
    this.cloudWatchManager.createDashboard('test-dashboard', this, this.props.testDashboard, [
      [alarmStatusWidget, graphWidget, logQueryWidget, singleValueWidget, textWidget],
    ])
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestCloudWatchConstruct', () => {
  test('handles mis-configurations as expected', () => {
    const error = () => new TestInvalidCommonStack(app, 'test-invalid-stack', testStackProps)
    expect(error).toThrow('Dashboard props undefined')
  })
})

describe('TestCloudWatchConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::CloudWatch::Alarm', 2)
    template.resourceCountIs('AWS::CloudWatch::Dashboard', 1)
  })
})

describe('TestCloudWatchConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testAlarmAlarmArn', {})
    template.hasOutput('testAlarmAlarmName', {})
    template.hasOutput('testAlarmMetricAlarmArn', {})
    template.hasOutput('testAlarmMetricAlarmName', {})
    template.hasOutput('testDashboardDashboardName', {})
  })
})

describe('TestCloudWatchConstruct', () => {
  test('provisions new alarm as expected', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      EvaluationPeriods: 1,
      AlarmDescription: 'Error in execution',
      AlarmName: 'test-alarm',
      DatapointsToAlarm: 1,
      Metrics: [
        {
          Expression: 'SUM(METRICS())',
          Id: 'expr_1',
        },
        {
          Id: 'm0',
          MetricStat: {
            Metric: {
              Dimensions: [
                {
                  Name: 'FunctionName',
                  Value: 'test-lambda-test',
                },
              ],
              MetricName: 'Errors',
              Namespace: 'AWS/Lambda',
            },
            Period: 3600,
            Stat: 'Sum',
          },
          ReturnData: false,
        },
        {
          Id: 'm1',
          MetricStat: {
            Metric: {
              MetricName: 'execution-error',
              Namespace: 'odc',
            },
            Period: 3600,
            Stat: 'Sum',
          },
          ReturnData: false,
        },
      ],
      Threshold: 1,
      TreatMissingData: 'missing',
    })

    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      EvaluationPeriods: 1,
      AlarmDescription: 'Error in execution',
      AlarmName: 'test-another-alarm',
      DatapointsToAlarm: 1,
      MetricName: 'ConcurrentExecutions',
      Namespace: 'AWS/Lambda',
      Period: 300,
      Statistic: 'Average',
      Threshold: 1,
      TreatMissingData: 'missing',
    })
  })
})

describe('TestCloudWatchConstruct', () => {
  test('provisions new dashboard as expected', () => {
    template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
      DashboardName: 'test-monitoring-dashboard',
    })
  })
})
