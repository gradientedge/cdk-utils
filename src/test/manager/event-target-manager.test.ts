import * as cdk from 'aws-cdk-lib'
import { Template } from 'aws-cdk-lib/assertions'
import { Construct } from 'constructs'
import { CommonConstruct, CommonStack, CommonStackProps } from '../../lib'

interface TestStackProps extends CommonStackProps {
  testLogGroup: any
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
      },
    }
  }
}

class TestCommonConstruct extends CommonConstruct {
  declare props: TestStackProps

  constructor(parent: Construct, name: string, props: TestStackProps) {
    super(parent, name, props)
    const testLogGroup = this.logManager.createLogGroup('test-log-group', this, this.props.testLogGroup)
    this.eventTargetManager.createCloudWatchLogGroupNoPolicy('test-log-group-target', this, testLogGroup)
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
      LogGroupName: 'test-lg-test',
    })
  })
})
