import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CloudWatchLogGroupNoPolicy, CommonConstruct, CommonStack, CommonStackProps } from '../../src/index.js'

interface TestStackProps extends CommonStackProps {
  testLogGroup: any
}

const testStackProps = {
  domainName: 'gradientedge.io',
  env: {
    account: '123456789',
    region: 'eu-west-1',
  },
  extraContexts: ['packages/aws/test/common/cdkConfig/logs.json'],
  name: 'test-common-stack',
  region: 'eu-west-1',
  stackName: 'test',
  stage: 'test',
  stageContextPath: 'packages/aws/test/common/cdkEnv',
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
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps
  logGroupTarget!: CloudWatchLogGroupNoPolicy

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testLogGroup = this.logManager.createLogGroup('test-log-group', this, this.props.testLogGroup)
    this.logGroupTarget = this.eventTargetManager.createCloudWatchLogGroupNoPolicy(
      'test-log-group-target',
      this,
      testLogGroup
    )
  }
}

const app = new cdk.App({ context: testStackProps })
const commonStack = new TestCommonStack(app, 'test-common-stack', testStackProps)
const template = Template.fromStack(commonStack)

describe('TestEventTargetConstruct', () => {
  test('synthesises as expected', () => {
    /* test if number of resources are correctly synthesised */
    template.resourceCountIs('AWS::Logs::LogGroup', 1)
    template.resourceCountIs('AWS::Logs::ResourcePolicy', 0)
  })
})

describe('TestEventTargetConstruct', () => {
  test('outputs as expected', () => {
    template.hasOutput('testLogGroupLogGroupArn', {})
  })
})

describe('TestEventTargetConstruct', () => {
  test('provisions new log group target as expected', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: 'test-lg',
    })
  })
})

describe('TestEventTargetConstruct', () => {
  test('bind returns a valid rule target config', () => {
    const construct = commonStack.construct as TestCommonConstruct
    const target = construct.logGroupTarget
    expect(target).toBeDefined()
    const config = target.bind()
    expect(config).toBeDefined()
    expect(config.arn).toBeDefined()
    expect(config.arn).toContain(':logs:')
    expect(config.arn).toContain('log-group')
    expect(config.targetResource).toBeDefined()
  })
})
