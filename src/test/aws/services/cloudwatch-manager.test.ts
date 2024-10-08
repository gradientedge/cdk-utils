import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib'

interface TestStackProps extends CommonStackProps {
  testAlarm: any
  testAlarmStatusWidget: any
  testAnotherAlarm: any
  testApiGatewayWidget: any
  testCacheWidget: any
  testCloudfrontDistributionWidget: any
  testCustomWidget: any
  testDashboard: any
  testEcsClusterWidget: any
  testEcsServiceWidget: any
  testElbWidget: any
  testEventWidget: any
  testGraphWidget: any
  testLambdaWidget: any
  testLogGroup: any
  testLogQueryWidget: any
  testMetric: any
  testSingleValueWidget: any
  testStateWidget: any
  testTextWidget: any
  testWidget: any
  testWidgets: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['src/test/aws/common/cdkConfig/dashboard.json', 'src/test/aws/common/cdkConfig/logs.json'],
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
        testAlarm: this.node.tryGetContext('testAlarm'),
        testAlarmStatusWidget: this.node.tryGetContext('testAlarmStatusWidget'),
        testAnotherAlarm: this.node.tryGetContext('testAnotherAlarm'),
        testApiGatewayWidget: this.node.tryGetContext('testApiGatewayWidget'),
        testCacheWidget: this.node.tryGetContext('testCacheWidget'),
        testCloudfrontDistributionWidget: this.node.tryGetContext('testCloudfrontDistributionWidget'),
        testCustomWidget: this.node.tryGetContext('testCustomWidget'),
        testDashboard: this.node.tryGetContext('testDashboard'),
        testEcsClusterWidget: this.node.tryGetContext('testEcsClusterWidget'),
        testEcsServiceWidget: this.node.tryGetContext('testEcsServiceWidget'),
        testElbWidget: this.node.tryGetContext('testElbWidget'),
        testEventWidget: this.node.tryGetContext('testEventWidget'),
        testGraphWidget: this.node.tryGetContext('testGraphWidget'),
        testLambdaWidget: this.node.tryGetContext('testLambdaWidget'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testLogQueryWidget: this.node.tryGetContext('testLogQueryWidget'),
        testMetric: this.node.tryGetContext('testMetric'),
        testSingleValueWidget: this.node.tryGetContext('testSingleValueWidget'),
        testStateWidget: this.node.tryGetContext('testStateWidget'),
        testTextWidget: this.node.tryGetContext('testTextWidget'),
        testWidget: this.node.tryGetContext('testWidget'),
        testWidgets: this.node.tryGetContext('testWidgets'),
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
        testAlarm: this.node.tryGetContext('testAlarm'),
        testAlarmStatusWidget: this.node.tryGetContext('testAlarmStatusWidget'),
        testAnotherAlarm: this.node.tryGetContext('testAnotherAlarm'),
        testApiGatewayWidget: this.node.tryGetContext('testApiGatewayWidget'),
        testCacheWidget: this.node.tryGetContext('testCacheWidget'),
        testCloudfrontDistributionWidget: this.node.tryGetContext('testCloudfrontDistributionWidget'),
        testCustomWidget: this.node.tryGetContext('testCustomWidget'),
        testEcsClusterWidget: this.node.tryGetContext('testEcsClusterWidget'),
        testEcsServiceWidget: this.node.tryGetContext('testEcsServiceWidget'),
        testElbWidget: this.node.tryGetContext('testElbWidget'),
        testEventWidget: this.node.tryGetContext('testEventWidget'),
        testGraphWidget: this.node.tryGetContext('testGraphWidget'),
        testLambdaWidget: this.node.tryGetContext('testLambdaWidget'),
        testLogGroup: this.node.tryGetContext('testLogGroup'),
        testLogQueryWidget: this.node.tryGetContext('testLogQueryWidget'),
        testMetric: this.node.tryGetContext('testMetric'),
        testSingleValueWidget: this.node.tryGetContext('testSingleValueWidget'),
        testStateWidget: this.node.tryGetContext('testStateWidget'),
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
    const cloudfrontDistributionWidget = this.cloudWatchManager.createCloudfrontDistributionWidget(
      'test-cf-widget',
      this,
      this.props.testCloudfrontDistributionWidget,
      'testDistributionId'
    )
    const apiGatewayWidget = this.cloudWatchManager.createApiGatewayWidget(
      'test-apig-widget',
      this,
      this.props.testApiGatewayWidget,
      'testApi'
    )
    const lambdaWidget = this.cloudWatchManager.createLambdaWidget(
      'test-lambda-widget',
      this,
      this.props.testLambdaWidget,
      'testLambda'
    )
    const ecsClusterWidget = this.cloudWatchManager.createEcsClusterWidget(
      'test-ecs-cluster-widget',
      this,
      this.props.testEcsClusterWidget,
      'testCluster'
    )
    const ecsServiceWidget = this.cloudWatchManager.createEcsServiceWidget(
      'test-ecs-service-widget',
      this,
      this.props.testEcsServiceWidget,
      'testCluster',
      'testService'
    )
    const elbWidget = this.cloudWatchManager.createElbWidget(
      'test-elb-widget',
      this,
      this.props.testElbWidget,
      'testLoadBalancer'
    )
    const cacheWidget = this.cloudWatchManager.createCacheWidget(
      'test-cache-widget',
      this,
      this.props.testCacheWidget,
      'testClusterId'
    )
    const stateWidget = this.cloudWatchManager.createStateWidget(
      'test-sfn-widget',
      this,
      this.props.testStateWidget,
      'testSfnArn'
    )
    const eventWidget = this.cloudWatchManager.createEventWidget(
      'test-event-widget',
      this,
      this.props.testEventWidget,
      'testBus',
      'testRule'
    )
    const customWidget = this.cloudWatchManager.createCustomWidget(
      'test-custom-widget',
      this,
      this.props.testCustomWidget,
      'testService'
    )
    this.cloudWatchManager.createWidget('test-widget', this, this.props.testWidget)
    this.cloudWatchManager.createWidgets(this, this.props.testWidgets)
    this.cloudWatchManager.createDashboard('test-dashboard', this, this.props.testDashboard, [
      [
        alarmStatusWidget,
        graphWidget,
        logQueryWidget,
        singleValueWidget,
        textWidget,
        cloudfrontDistributionWidget,
        apiGatewayWidget,
        lambdaWidget,
        ecsClusterWidget,
        ecsServiceWidget,
        elbWidget,
        cacheWidget,
        stateWidget,
        eventWidget,
        customWidget,
      ],
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
      AlarmDescription: 'Error in execution',
      AlarmName: 'test-alarm',
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      DatapointsToAlarm: 1,
      EvaluationPeriods: 1,
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
                  Value: 'test-lambda',
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
      AlarmDescription: 'Error in execution',
      AlarmName: 'test-another-alarm',
      ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      DatapointsToAlarm: 1,
      EvaluationPeriods: 1,
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
      DashboardName: 'cdktest-test-monitoring-dashboard-test',
    })
  })
})
