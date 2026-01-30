import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import * as watch from 'aws-cdk-lib/aws-cloudwatch'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../../lib/aws/index.js'

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

describe('TestCloudWatchConstruct - Error Handling', () => {
  test('throws error when creating alarm without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-1', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createAlarmForExpression('test-alarm-no-props', testConstruct, null as any)
    }).toThrow('Alarm props undefined for test-alarm-no-props')
  })

  test('throws error when creating alarm without expression', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-2', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createAlarmForExpression('test-alarm-no-expr', testConstruct, {
        metricProps: [],
      } as any)
    }).toThrow('Could not find expression for Alarm props for id:test-alarm-no-expr')
  })

  test('throws error when creating alarm without metricProps', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-3', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createAlarmForExpression('test-alarm-no-metrics', testConstruct, {
        expression: 'SUM(METRICS())',
      } as any)
    }).toThrow('Could not find metricProps for Alarm props for id:test-alarm-no-metrics')
  })

  test('throws error when creating alarm for metric without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-4', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)
    const testMetric = new watch.Metric({ metricName: 'test', namespace: 'test' })

    expect(() => {
      testConstruct.cloudWatchManager.createAlarmForMetric(
        'test-alarm-metric-no-props',
        testConstruct,
        null as any,
        testMetric
      )
    }).toThrow('Alarm props undefined for test-alarm-metric-no-props')
  })

  test('throws error when creating dashboard without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-5', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createDashboard('test-dashboard-no-props', testConstruct, null as any)
    }).toThrow('Dashboard props undefined for test-dashboard-no-props')
  })

  test('throws error when creating dashboard without dashboardName', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-6', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createDashboard('test-dashboard-no-name', testConstruct, {} as any)
    }).toThrow('Dashboard dashboardName undefined for test-dashboard-no-name')
  })

  test('throws error when creating widgets with empty array', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-7', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createWidgets(testConstruct, [])
    }).toThrow('Widget props undefined')
  })

  test('throws error when creating widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-8', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createWidget('test-widget-no-props', testConstruct, null as any)
    }).toThrow('Widget props undefined for test-widget-no-props')
  })

  test('throws error for unsupported widget type', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-9', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createWidget('test-widget-invalid', testConstruct, { type: 'InvalidType' } as any)
    }).toThrow('Unsupported widget type InvalidType')
  })

  test('throws error when creating text widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-10', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createTextWidget('test-text-widget-no-props', testConstruct, null as any)
    }).toThrow('Widget props undefined for test-text-widget-no-props')
  })

  test('throws error when creating single value widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-11', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createSingleValueWidget('test-sv-widget-no-props', testConstruct, null as any, [])
    }).toThrow('Widget props undefined for test-sv-widget-no-props')
  })

  test('throws error when creating guage widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-12', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createGuageWidget('test-guage-widget-no-props', testConstruct, null as any, [])
    }).toThrow('Widget props undefined for test-guage-widget-no-props')
  })

  test('throws error when creating graph widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-13', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createGraphWidget('test-graph-widget-no-props', testConstruct, null as any)
    }).toThrow('Widget props undefined for test-graph-widget-no-props')
  })

  test('throws error when creating alarm status widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-14', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createAlarmStatusWidget(
        'test-alarm-widget-no-props',
        testConstruct,
        null as any,
        []
      )
    }).toThrow('Widget props undefined for test-alarm-widget-no-props')
  })

  test('throws error when creating log query widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-15', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createLogQueryWidget('test-log-widget-no-props', testConstruct, null as any, [])
    }).toThrow('Widget props undefined for test-log-widget-no-props')
  })

  test('throws error when creating cloudfront widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-16', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createCloudfrontDistributionWidget(
        'test-cf-widget-no-props',
        testConstruct,
        null as any,
        'distId'
      )
    }).toThrow('Widget props undefined for test-cf-widget-no-props')
  })

  test('throws error when creating state widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-17', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createStateWidget(
        'test-state-widget-no-props',
        testConstruct,
        null as any,
        'sfnArn'
      )
    }).toThrow('Widget props undefined for test-state-widget-no-props')
  })

  test('throws error when creating event widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-18', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createEventWidget(
        'test-event-widget-no-props',
        testConstruct,
        null as any,
        'bus',
        'rule'
      )
    }).toThrow('Widget props undefined for test-event-widget-no-props')
  })

  test('throws error when creating api gateway widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-19', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createApiGatewayWidget(
        'test-api-widget-no-props',
        testConstruct,
        null as any,
        'apiName'
      )
    }).toThrow('Widget props undefined for test-api-widget-no-props')
  })

  test('throws error when creating lambda widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-20', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createLambdaWidget(
        'test-lambda-widget-no-props',
        testConstruct,
        null as any,
        'fnName'
      )
    }).toThrow('Widget props undefined for test-lambda-widget-no-props')
  })

  test('throws error when creating custom widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-21', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createCustomWidget(
        'test-custom-widget-no-props',
        testConstruct,
        null as any,
        'service'
      )
    }).toThrow('Widget props undefined for test-custom-widget-no-props')
  })

  test('throws error when creating ecs cluster widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-22', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createEcsClusterWidget(
        'test-ecs-widget-no-props',
        testConstruct,
        null as any,
        'cluster'
      )
    }).toThrow('Widget props undefined for test-ecs-widget-no-props')
  })

  test('throws error when creating ecs service widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-23', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createEcsServiceWidget(
        'test-ecs-svc-widget-no-props',
        testConstruct,
        null as any,
        'cluster',
        'service'
      )
    }).toThrow('Widget props undefined for test-ecs-svc-widget-no-props')
  })

  test('throws error when creating elb widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-24', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createElbWidget('test-elb-widget-no-props', testConstruct, null as any, 'lb')
    }).toThrow('Widget props undefined for test-elb-widget-no-props')
  })

  test('throws error when creating cache widget without props', () => {
    const testStack = new TestCommonStack(app, 'test-error-stack-25', testStackProps)
    const testConstruct = new CommonConstruct(testStack, 'test-construct', testStackProps as any)

    expect(() => {
      testConstruct.cloudWatchManager.createCacheWidget(
        'test-cache-widget-no-props',
        testConstruct,
        null as any,
        'clusterId'
      )
    }).toThrow('Widget props undefined for test-cache-widget-no-props')
  })
})
